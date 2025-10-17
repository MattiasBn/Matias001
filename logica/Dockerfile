# ======================================================================
# FASE 1: BUILD (Construção do Laravel)
# ======================================================================
FROM php:8.2-fpm AS laravel_build

WORKDIR /var/www/html

# Instalar dependências de sistema e extensões PHP (sem dev)
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

# Instalar dependências PHP
RUN composer install --no-dev --optimize-autoloader

# Garantir permissões corretas
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ======================================================================
# FASE 2: RUNTIME (Execução)
# ======================================================================
FROM php:8.2-fpm

# Instalar Nginx e Supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copiar arquivos do build
COPY --from=laravel_build /var/www/html /var/www/html

# Copiar configs
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Ajustar permissões finais
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expor porta HTTP
EXPOSE 80

# Comando é definido no Render (Docker Command)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]