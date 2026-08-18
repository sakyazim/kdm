$p = Start-Process -FilePath "python" -ArgumentList "manager-v2/server.py" -WorkingDirectory (Get-Location) -PassThru -WindowStyle Hidden -RedirectStandardOutput "manager-v2/server.log" -RedirectStandardError "manager-v2/server.err.log"
Start-Sleep -Seconds 2
Write-Output "PID: $($p.Id)"
