# Gunakan Node.js versi LTS sebagai base image
FROM node:18-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan yarn.lock untuk dependency installation
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy seluruh source code ke working directory
COPY . .

# Buat direktori yang diperlukan
RUN mkdir -p logs uploads sezz/auth database/data

# Set permission untuk direktori yang diperlukan
RUN chown -R node:node /app

# Switch ke user node untuk keamanan
USER node

# Expose port jika diperlukan (opsional, karena ini WhatsApp bot)
# EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Health check untuk memastikan aplikasi berjalan
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD ps aux | grep -q "[n]ode.*index" || exit 1

# Command untuk menjalankan aplikasi
CMD ["yarn", "start"]
