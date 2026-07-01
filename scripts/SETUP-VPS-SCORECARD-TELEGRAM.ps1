# Double-click from repo root (or run in PowerShell).
# Copies the generator key to clipboard and prints the one-liner for the VPS.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$localRoot = Resolve-Path (Join-Path $repoRoot "..\..\.local")
$keyFile = Join-Path $localRoot "scorecard-generator-api-key.txt"

if (-not (Test-Path $keyFile)) {
  Write-Host "Missing $keyFile" -ForegroundColor Red
  exit 1
}

$key = (Get-Content $keyFile -Raw).Trim()
if (-not $key) {
  Write-Host "Key file is empty." -ForegroundColor Red
  exit 1
}

Set-Clipboard -Value $key
Write-Host "GENERATOR_API_KEY copied to clipboard." -ForegroundColor Green
Write-Host ""
Write-Host "On the VPS (SSH as root), paste this block:" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
curl -fsSL -o /tmp/vps-enable-instant-telegram.sh \
  "https://raw.githubusercontent.com/bearllc555-spec/998webdesigns-com-site/main/scorecard/generator/vps-enable-instant-telegram.sh"
bash /tmp/vps-enable-instant-telegram.sh '$key'
"@
