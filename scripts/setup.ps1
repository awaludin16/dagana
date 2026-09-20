# Setup awal monorepo Dagana (Phase 0) - PowerShell
Write-Host "==> Setup backend (Laravel)"
Set-Location apps/api
composer install

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  php artisan key:generate
}
Write-Host "    Sesuaikan kredensial DB di apps/api/.env lalu jalankan:"
Write-Host "    php artisan migrate --seed"

Write-Host "==> Setup frontend"
foreach ($app in @("admin-web", "customer-web")) {
  Write-Host "    -> apps/$app"
  Set-Location "../$app"
  npm install
}

Write-Host "Done. Panduan: lihat README.md"