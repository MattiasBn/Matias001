# ======================================================
# Etapa 1 — Build do Laravel com Composer
# ======================================================
FROM php:8.2-fpm AS build

WORKDIR /var/www/html

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Copiar Composer do container oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar o código Laravel
COPY . /var/www/html

# Instalar dependências Laravel (produção)
RUN composer install --no-dev --optimize-autoloader

# Permissões corretas
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache


# ======================================================
# Etapa 2 — Imagem final para produção
# ======================================================
FROM php:8.2-fpm

WORKDIR /var/www/html

# Instalar Nginx e Supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Copiar aplicação e configs do build
COPY --from=build /var/www/html /var/www/html
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

# Expôr a porta HTTP
EXPOSE 80

# ======================================================
# ENTRYPOINT — tudo automático
# ======================================================
CMD bash -c "\
echo '🧩 Iniciando container Laravel...' && \
if [ ! -f /var/www/html/.env ]; then \
    echo '⚙️ Nenhum .env detectado — usando variáveis do Render'; \
    cp /var/www/html/.env.example /var/www/html/.env || true; \
fi && \
php artisan config:cache || true && \
php artisan route:cache || true && \
echo '✅ Laravel pronto (usando APP_KEY do Render)' && \
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf"
