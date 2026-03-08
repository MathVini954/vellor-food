$ErrorActionPreference = "Stop"

$publicAppPath = Join-Path $PSScriptRoot "..\\public-app"

Push-Location $publicAppPath
try {
  & npm.cmd run db:local:start
  & npm.cmd run dev
}
finally {
  Pop-Location
}
