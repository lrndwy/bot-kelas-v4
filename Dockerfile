# Gunakan Node.js versi LTS sebagai base image
FROM node:18-alpine

# Set metadata
LABEL maintainer="Bot Kelas V4"
LABEL description="WhatsApp Bot untuk Manajemen Kelas"
LABEL version="3.0.5"

# Install dependencies sistem yang diperlukan
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads \
    && mkdir -p database/data \
    && mkdir -p sezz/auth \
    && mkdir -p logs

# Set proper permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Create volume untuk data persistent
VOLUME ["/app/sezz", "/app/database", "/app/uploads", "/app/logs"]

# Expose port (opsional, jika ada web interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "console.log('Bot is running')" || exit 1

# Set environment variables default
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Start command
CMD ["npm", "start"]
