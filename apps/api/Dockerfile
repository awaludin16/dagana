# Gunakan image PHP 8.5 resmi yang sudah include Apache Web Server
FROM php:8.5-apache

# 1. Install extension yang dibutuhkan Laravel (Postgres, ICU/Intl, Zip, Redis)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    unzip \
    zip \
    && docker-php-ext-install intl pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Aktifkan modul Apache rewrite (Wajib untuk routing Laravel)
RUN a2enmod rewrite

# 3. Ubah Document Root Apache agar mengarah ke folder 'public' Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 4. Salin file Composer dari image resmi
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 5. Set folder kerja di dalam container
WORKDIR /var/www/html

# 6. Salin SELURUH kode Laravel dari folder apps/api ke dalam container
COPY . .

# 7. Jalankan Composer Install untuk production (tanpa dev dependencies)
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader

# 8. Atur hak akses/permission folder storage dan bootstrap (Wajib agar Laravel tidak error 500)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Izinkan script entrypoint agar bisa dieksekusi
RUN chmod +x /var/www/html/entrypoint.sh

# 9. Buka port 80 untuk lalu lintas web
EXPOSE 80

# 10. Jalankan Entrypoint script untuk menjalankan Laravel
ENTRYPOINT ["/var/www/html/entrypoint.sh"]
