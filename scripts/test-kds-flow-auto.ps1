param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Email,
  [Parameter(Mandatory = $true, Position = 1)]
  [string]$Password,
  [Parameter(Position = 2)]
  [string]$BaseUrl = 'http://localhost:3000',
  [Parameter(Position = 3)]
  [string]$RestaurantId
)

$ErrorActionPreference = 'Stop'

function Invoke-ApiRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [string]$Method,
    [hashtable]$Headers,
    [object]$Body
  )

  $requestParams = @{
    Uri    = $Uri
    Method = $Method
  }

  if ($Headers) {
    $requestParams.Headers = $Headers
  }

  if ($null -ne $Body) {
    $requestParams.ContentType = 'application/json'
    $requestParams.Body = ($Body | ConvertTo-Json -Compress -Depth 10)
  }

  $statusCode = 0
  $rawContent = ''
  $jsonContent = $null

  try {
    $response = Invoke-WebRequest @requestParams
    $statusCode = [int]$response.StatusCode
    $rawContent = $response.Content
  } catch {
    $httpResponse = $_.Exception.Response

    if ($null -eq $httpResponse) {
      throw
    }

    $statusCode = [int]$httpResponse.StatusCode

    try {
      $stream = $httpResponse.GetResponseStream()
      if ($null -ne $stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $rawContent = $reader.ReadToEnd()
        $reader.Dispose()
        $stream.Dispose()
      }
    } catch {
      $rawContent = ''
    }

    if ([string]::IsNullOrWhiteSpace($rawContent)) {
      $detailsMessage = $_.ErrorDetails.Message
      if (-not [string]::IsNullOrWhiteSpace($detailsMessage)) {
        $rawContent = $detailsMessage
      }
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($rawContent)) {
    try {
      $jsonContent = $rawContent | ConvertFrom-Json -Depth 20
    } catch {
      $jsonContent = $null
    }
  }

  return [pscustomobject]@{
    StatusCode = $statusCode
    RawContent = $rawContent
    Json       = $jsonContent
  }
}

function Assert-SuccessStatus {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Response,
    [Parameter(Mandatory = $true)]
    [string]$StepName
  )

  if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
    return
  }

  Write-Error "$StepName a echoue (HTTP $($Response.StatusCode)): $($Response.RawContent)"
  exit 1
}

$base = $BaseUrl.TrimEnd('/')

Write-Output "[1/5] Health check: $base/health"
$health = Invoke-ApiRequest -Uri "$base/health" -Method 'GET'
Assert-SuccessStatus -Response $health -StepName 'Health check'

Write-Output "[2/5] Owner login: $base/auth/login"
$login = Invoke-ApiRequest -Uri "$base/auth/login" -Method 'POST' -Body @{
  email = $Email
  password = $Password
}
Assert-SuccessStatus -Response $login -StepName 'Auth login'

$ownerToken = [string]$login.Json.session.access_token
if ([string]::IsNullOrWhiteSpace($ownerToken)) {
  Write-Error "Reponse login sans session.access_token: $($login.RawContent)"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($RestaurantId)) {
  $RestaurantId = [string]$login.Json.user.restaurant_id
}

if ([string]::IsNullOrWhiteSpace($RestaurantId)) {
  Write-Error 'RestaurantId introuvable. Fournissez -RestaurantId ou un compte login lie a un restaurant.'
  exit 1
}

Write-Output "[3/5] Pairing generate: $base/pairing/generate"
$generate = Invoke-ApiRequest \
  -Uri "$base/pairing/generate" \
  -Method 'POST' \
  -Headers @{ Authorization = "Bearer $ownerToken" } \
  -Body @{ restaurantId = $RestaurantId }
Assert-SuccessStatus -Response $generate -StepName 'Pairing generate'

$pairingCode = [string]$generate.Json.code
if ([string]::IsNullOrWhiteSpace($pairingCode)) {
  Write-Error "Reponse pairing/generate sans code: $($generate.RawContent)"
  exit 1
}

Write-Output "Code genere: $pairingCode"

Write-Output "[4/5] Pairing connect: $base/pairing/connect"
$connect = Invoke-ApiRequest -Uri "$base/pairing/connect" -Method 'POST' -Body @{ code = $pairingCode }
Assert-SuccessStatus -Response $connect -StepName 'Pairing connect'

$kdsToken = [string]$connect.Json.token
if ([string]::IsNullOrWhiteSpace($kdsToken)) {
  Write-Error "Reponse pairing/connect sans token: $($connect.RawContent)"
  exit 1
}

Write-Output "[5/5] Kitchen snapshot: $base/kitchen/orders/me"
$kitchen = Invoke-ApiRequest \
  -Uri "$base/kitchen/orders/me" \
  -Method 'GET' \
  -Headers @{ Authorization = "Bearer $kdsToken" }
Assert-SuccessStatus -Response $kitchen -StepName 'Kitchen orders'

Write-Output "Succes end-to-end KDS (HTTP $($kitchen.StatusCode))"

$result = [pscustomobject]@{
  baseUrl      = $base
  restaurantId = $RestaurantId
  pairingCode  = $pairingCode
  kitchenHttp  = $kitchen.StatusCode
  kitchenData  = $kitchen.Json
}

$result | ConvertTo-Json -Depth 20
