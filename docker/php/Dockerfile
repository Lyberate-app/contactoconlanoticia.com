FROM php:8.3-cli

# ── Extensiones del sistema ──────────────────────────────
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libavif-dev \
    libfreetype6-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    && docker-php-ext-configure gd \
        --with-jpeg \
        --with-webp \
        --with-freetype \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Redis extension ──────────────────────────────────────
RUN pecl install redis && docker-php-ext-enable redis

# ── Composer ────────────────────────────────────────────
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/api

