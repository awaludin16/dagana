#!/usr/bin/env bash
# Setup awal monorepo Dagana (Phase 0)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Setup backend (Laravel)"
cd apps/api
composer install

if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate
fi
echo "    Sesuaikan kredensial DB di apps/api/.env lalu jalankan:"
echo "    php artisan migrate --seed"

echo "==> Setup frontend"
for app in admin-web customer-web; do
  echo "    -> apps/$app"
  (cd "../$app" && npm install)
done

echo "Done. Panduan: lihat README.md"