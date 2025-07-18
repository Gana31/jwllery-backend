# Use official Node.js LTS image
FROM node:20-slim

# Install Chromium dependencies for Puppeteer, Devanagari fonts, and cron
# Replace the individual font packages with fonts-noto and fonts-noto-extra
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-noto-unhinted \
    fonts-noto-mono \
    fonts-noto-ui-core \
    fonts-noto-ui-extra \
    fonts-noto-extra \
    fonts-noto-core \
    fonts-indic \
    wget \
    gnupg \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    cron \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies (for better caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the backend code
COPY . .

# Add crontab file
COPY crontab /etc/cron.d/app-cron
RUN chmod 0644 /etc/cron.d/app-cron && \
    crontab /etc/cron.d/app-cron

# Expose the backend port
EXPOSE 8000

# Default environment variables (can be overridden)
ENV NODE_ENV=production

# Add script to start both cron and the server
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Start both cron and the Node server
ENTRYPOINT ["docker-entrypoint.sh"] 