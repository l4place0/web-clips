param(
  [Parameter(Mandatory = $true)]
  [string]$Node,

  [Parameter(Mandatory = $true)]
  [string]$Cli,

  [Parameter(Mandatory = $true)]
  [string]$Repository
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $Repository
& $Node $Cli now --scheduled --root $Repository
exit $LASTEXITCODE
