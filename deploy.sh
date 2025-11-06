#!/bin/bash

# Deployment script for AWS Ubuntu
# Run this on your AWS instance after cloning the repository

echo "🚀 Starting deployment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    cat > .env << EOF
PORT=3000
SESSION_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=admin123
NODE_ENV=production
EOF
    echo "⚠️  Please edit .env and set a secure ADMIN_PASSWORD!"
fi

# Create logs directory
mkdir -p logs

# Create backups directory
mkdir -p backups

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 delete offer-platform 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
echo "🔧 Setting up PM2 startup..."
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart app"
echo ""
echo "📝 Next steps:"
echo "1. Configure Nginx (see DEPLOY.md)"
echo "2. Set up SSL with Let's Encrypt"
echo "3. Change admin password in .env"

