#!/bin/sh

# Bersihkan cache lama agar membaca env produksi terbaru
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Jalankan migrasi database
php artisan migrate --force

# Buat cache baru yang segar untuk produksi
php artisan config:cache
php artisan route:cache

# Jalankan perintah utama Apache (bawaan dari CMD Dockerfile)
exec apache2-foreground
