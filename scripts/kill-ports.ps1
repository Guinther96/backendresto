param(
  [int[]]$Ports = @(3000, 3001, 3002, 3003, 3004, 3005)
)

$killedPids = New-Object 'System.Collections.Generic.HashSet[int]'

foreach ($port in $Ports) {
  try {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop
  } catch {
    continue
  }

  foreach ($connection in $connections) {
    $processId = [int]$connection.OwningProcess

    if ($killedPids.Contains($processId)) {
      continue
    }

    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      $killedPids.Add($processId) | Out-Null
      Write-Output "Stopped PID $processId on port $port"
    } catch {
      Write-Output "Could not stop PID $processId on port ${port}: $($_.Exception.Message)"
    }
  }
}

if ($killedPids.Count -eq 0) {
  Write-Output 'No listeners found on target ports.'
}
