# Usa uma imagem base que já tem Nginx e PHP
FROM ambientum/php:8.2-nginx

# Define o diretório de trabalho dentro do container
WORKDIR /var/www/html

# Copia todos os ficheiros do seu Laravel para o container
COPY . /var/www/html

# Instala as dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala as extensões PHP necessárias para o Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath opcache

# Define as permissões para a aplicação
RUN chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Instala as dependências do Composer
RUN composer install --no-dev --optimize-autoloader

# Publica a configuração padrão do Nginx da imagem base (necessário para rodar)
RUN bash /usr/bin/publish-nginx-config

# Configura o supervisor para iniciar Nginx e PHP-FPM
# O comando de entrada (ENTRYPOINT) da imagem base já faz isso automaticamente