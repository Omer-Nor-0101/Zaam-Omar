# Puts a random JWT_SECRET into server\.env
$p = Join-Path $PSScriptRoot 'server\.env'
$s = -join ((1..48) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
(Get-Content $p) -replace '^JWT_SECRET=.*', "JWT_SECRET=$s" | Set-Content $p
