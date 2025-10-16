# ======================================================================
# FASE 1: BUILD (Construção do Laravel)
# ======================================================================
FROM php:8.2-fpm AS laravel_build

# Diretório de trabalho
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

# Copiar o Laravel para o container
COPY . /var/www/html

# Instalar dependências PHP (sem dev)
RUN composer install --no-dev --optimize-autoloader

# Permissões adequadas para o Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ======================================================================
# FASE 2: RUNTIME (Execução com Nginx + PHP-FPM via Supervisor)
# ======================================================================
FROM php:8.2-fpm

WORKDIR /var/www/html

# Instalar Nginx e Supervisor novamente no runtime
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copiar os ficheiros gerados na build
COPY --from=laravel_build /var/www/html /var/www/html

# Copiar configurações personalizadas
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Expor porta padrão
EXPOSE 80

# Iniciar o supervisor (que inicia Nginx + PHP-FPM)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
