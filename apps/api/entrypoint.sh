#!/bin/sh

# Bersihkan semua cache lama saat container menyala
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Buat cache baru untuk konfigurasi dan route
php artisan config:cache
php artisan route:cache

# Opsional: Jalankan migrasi database otomatis jika dibutuhkan di production
# php artisan migrate --force

# Jalankan perintah utama Apache (bawaan dari CMD Dockerfile)
exec apache2-foreground
