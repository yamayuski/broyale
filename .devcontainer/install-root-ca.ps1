Param(
  [string]$CAFile = "certs/ca/rootCA.pem"
)

if (-Not (Test-Path $CAFile)) {
  Write-Host "rootCA.pem Not found. Please start the DevContainer once to generate the certificate." -ForegroundColor Yellow
  exit 1
}

Write-Host "[install-root-ca] Importing $CAFile to Windows Root store (Administrator privileges required)."
# PEM -> CER
$tempCer = Join-Path ([System.IO.Path]::GetTempPath()) "webtransport-root.cer"
Start-Process -FilePath "certutil.exe" -ArgumentList @("-addstore","-f","Root",$CAFile) -Verb runAs -Wait
Write-Host "[install-root-ca] Done. Please restart your browser."
