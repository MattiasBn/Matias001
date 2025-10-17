# ======================================================================
# FASE 1: BUILD (instala dependências e prepara o Laravel)
# ======================================================================
FROM php:8.2-fpm AS build

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    nginx \
    supervisor \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar o código Laravel
COPY . /var/www/html

# Instalar dependências
RUN composer install --no-dev --optimize-autoloader

# Permissões corretas
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ======================================================================
# FASE 2: RUNTIME (Laravel + Nginx + Supervisor)
# ======================================================================
FROM php:8.2-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

COPY --from=build /var/www/html /var/www/html

# Copiar config do Nginx e Supervisor
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Expõe a porta 80 para o Render
EXPOSE 80

# ======================================================================
# Comando principal — tudo automático
# ======================================================================
CMD php artisan key:generate && php artisan config:cache && php artisan migrate --force && /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
