param(
  [string]$BaseUrl = 'http://localhost:3000',
  [Parameter(Mandatory = $true)]
  [string]$PairingCode
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

  if ($rawContent) {
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

$base = $BaseUrl.TrimEnd('/')
Write-Output "[1/3] Health check: $base/health"

$health = Invoke-ApiRequest -Uri "$base/health" -Method 'GET'
if ($health.StatusCode -lt 200 -or $health.StatusCode -ge 300) {
  Write-Error "API indisponible (HTTP $($health.StatusCode)): $($health.RawContent)"
  exit 1
}

Write-Output "[2/3] Pairing connect: $base/pairing/connect"
$connect = Invoke-ApiRequest -Uri "$base/pairing/connect" -Method 'POST' -Body @{ code = $PairingCode }

if ($connect.StatusCode -lt 200 -or $connect.StatusCode -ge 300) {
  Write-Error "Echec pairing/connect (HTTP $($connect.StatusCode)): $($connect.RawContent)"
  exit 1
}

$token = [string]$connect.Json.token
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error "Reponse pairing/connect sans token: $($connect.RawContent)"
  exit 1
}

$restaurantId = [string]$connect.Json.restaurantId
Write-Output "Token KDS recu pour restaurant: $restaurantId"

Write-Output "[3/3] Kitchen snapshot: $base/kitchen/orders/me"
$kitchen = Invoke-ApiRequest -Uri "$base/kitchen/orders/me" -Method 'GET' -Headers @{ Authorization = "Bearer $token" }

if ($kitchen.StatusCode -lt 200 -or $kitchen.StatusCode -ge 300) {
  Write-Error "Echec kitchen/orders/me (HTTP $($kitchen.StatusCode)): $($kitchen.RawContent)"
  exit 1
}

Write-Output "Succes kitchen/orders/me (HTTP $($kitchen.StatusCode))"
if ($kitchen.Json) {
  $kitchen.Json | ConvertTo-Json -Depth 20
} else {
  $kitchen.RawContent
}
