param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action
)

$base = Join-Path $env:LOCALAPPDATA 'meu-ifood-public-db'
$data = Join-Path $base 'data'
$log = Join-Path $base 'postgres.log'
$pgCtl = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'

if (!(Test-Path $data)) {
  Write-Error "Banco local nao inicializado em $data"
  exit 1
}

switch ($Action) {
  'start' {
    & $pgCtl -D $data -l $log -o ' -p 5433' start
  }
  'stop' {
    & $pgCtl -D $data stop
  }
  'status' {
    & $pgCtl -D $data status
  }
}
