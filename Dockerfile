# Gunakan Node.js versi LTS sebagai base image
FROM node:20-alpine

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

# Install dependencies using yarn
RUN yarn install --production --frozen-lockfile

# Copy source code
COPY . .

# Create user with matching UID from host (macOS compatibility)
RUN deluser node \
    && addgroup -g 20 staff \
    && adduser -D -u 501 -G staff hafiz

# Create necessary directories and set proper permissions
RUN mkdir -p /app/uploads \
    && mkdir -p /app/database/data \
    && mkdir -p /app/sezz/auth \
    && mkdir -p /app/logs \
    && chown -R hafiz:staff /app/uploads \
    && chown -R hafiz:staff /app/database \
    && chown -R hafiz:staff /app/sezz \
    && chown -R hafiz:staff /app/logs \
    && chown -R hafiz:staff /app

# Switch to matching user
USER hafiz

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

# Start command with selective directory creation
CMD ["sh", "-c", "mkdir -p /app/database/data && yarn start"]
