# ======================================================
# Etapa 1 — Construção
# ======================================================
FROM php:8.2-fpm AS build

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libjpeg-dev libfreetype6-dev libzip-dev libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . /var/www/html

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ======================================================
# Etapa 2 — Execução
# ======================================================
FROM php:8.2-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /var/www/html /var/www/html

# Corrige caminho do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Permissões corretas no container final
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

# ======================================================
# ENTRYPOINT — inicialização automática e compatível com Render
# ======================================================

CMD bash -c "\
if [ ! -f .env ]; then cp .env.example .env || echo 'APP_KEY=' > .env; fi && \
php artisan key:generate --force && \
php artisan config:cache && \
php artisan route:cache && \
echo '✅ Laravel iniciado com sucesso' && \
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf"
