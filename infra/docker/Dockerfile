# Dagana API --- build image Laravel (PHP-FPM + Composer)
FROM php:8.3-fpm

# Extensions yang diperlukan
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libicu-dev \
        nano \
        unzip \
    && docker-php-ext-install pdo_pgsql pgsql pcntl bcmath intl zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependensi dulu (cache layer)
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-interaction --no-progress --optimize-autoloader

# Kode aplikasi
COPY apps/api/ .

RUN mkdir -p storage/framework/{sessions,views,cache} \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]