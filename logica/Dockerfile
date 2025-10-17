# ======================================================================
# FASE 1: BUILD (Construção do Laravel)
# ======================================================================
FROM php:8.2-fpm AS laravel_build

WORKDIR /var/www/html

# Instalar dependências de sistema e extensões PHP
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath opcache zip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar Laravel
COPY . /var/www/html

# Instalar dependências PHP (sem dev)
RUN composer install --no-dev --optimize-autoloader

# Garantir permissões corretas
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ======================================================================
# FASE 2: RUNTIME (Execução + Automação)
# ======================================================================
FROM php:8.2-fpm

WORKDIR /var/www/html

# Instalar Nginx e Supervisor no runtime
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copiar arquivos do build
COPY --from=laravel_build /var/www/html /var/www/html

# Copiar configs
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Gerar APP_KEY, rodar migrations e limpar cache automaticamente
RUN php artisan key:generate --force \
    && php artisan migrate --force || true \
    && php artisan optimize:clear \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Ajustar permissões finais
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expor porta HTTP
EXPOSE 80

# Iniciar Supervisor (que inicia Nginx + PHP-FPM)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
