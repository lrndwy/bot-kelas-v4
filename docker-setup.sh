#!/bin/bash

# WhatsApp Bot Kelas V4 - Docker Setup Script
echo "🚀 Setting up WhatsApp Bot Kelas V4 with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "📍 Important: Set your BOT_NUMBER, OWNER_NUMBER, and other configurations in .env"
else
    echo "✅ .env file already exists."
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p sezz/auth
mkdir -p database/data
mkdir -p uploads
mkdir -p logs

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 sezz database uploads logs
chmod 644 .env

# Build Docker image
echo "🔨 Building Docker image with Yarn..."
docker-compose build

# Start the bot
echo "🚀 Starting the bot..."
docker-compose up -d

# Show status
echo ""
echo "✅ Setup completed!"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 Useful commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop bot: docker-compose down"
echo "  • Restart bot: docker-compose restart"
echo "  • Update bot: docker-compose pull && docker-compose up -d"
echo "  • Install new package: docker-compose exec wabase-bot yarn add <package>"
echo "  • Remove package: docker-compose exec wabase-bot yarn remove <package>"
echo ""
echo "🔗 First run:"
echo "  1. Check logs: docker-compose logs -f"
echo "  2. Scan QR code or use pairing code"
echo "  3. Bot will be ready to use!"
echo ""
echo "⚠️  Make sure to configure .env file properly before first run!"
