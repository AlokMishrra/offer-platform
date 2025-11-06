# Deployment Guide for AWS Ubuntu Instance

## Prerequisites
- Ubuntu 20.04+ on AWS EC2
- SSH access to your instance
- Domain name (optional, for SSL)

## Step 1: Connect to Your AWS Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

## Step 2: Install Node.js and npm

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 4: Transfer Your Application

### Option A: Using Git (Recommended)
```bash
# On your AWS instance
cd /home/ubuntu
git clone your-repository-url offer-platform
cd offer-platform
npm install
```

### Option B: Using SCP
```bash
# On your local machine
scp -i your-key.pem -r /path/to/offer ubuntu@your-ec2-ip:/home/ubuntu/
# Then on AWS instance
cd /home/ubuntu/offer
npm install
```

## Step 5: Configure Environment Variables

```bash
cd /home/ubuntu/offer  # or your app directory
nano .env
```

Add:
```
PORT=3000
SESSION_SECRET=your_strong_random_secret_here
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
```

Generate a strong SESSION_SECRET:
```bash
openssl rand -base64 32
```

## Step 6: Set Up PM2

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

Start the application with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow the command output to enable PM2 on boot
```

## Step 7: Configure Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Step 8: Install and Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/offer-platform
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/offer-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Step 10: Verify Everything Works

```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check application
curl http://localhost:3000
```

## Useful Commands

```bash
# PM2 commands
pm2 status              # Check app status
pm2 logs                # View logs
pm2 restart all         # Restart app
pm2 stop all            # Stop app
pm2 monit               # Monitor dashboard

# Nginx commands
sudo systemctl restart nginx
sudo nginx -t           # Test config
sudo tail -f /var/log/nginx/error.log

# View application logs
pm2 logs offer-platform
```

## Troubleshooting

1. **Port already in use**: Change PORT in .env or kill the process
2. **Permission denied**: Check file permissions: `chmod -R 755 /home/ubuntu/offer`
3. **Database errors**: Ensure SQLite file has write permissions
4. **502 Bad Gateway**: Check if PM2 is running: `pm2 status`

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET
- [ ] Enable firewall (UFW)
- [ ] Set up SSL/HTTPS
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Restrict SSH access (use key-based auth only)
- [ ] Regular backups of database file (`src/storage/offer.db`)

## Backup Database

```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /home/ubuntu/offer/src/storage/offer.db /home/ubuntu/backups/offer_$DATE.db
# Keep only last 7 days
find /home/ubuntu/backups -name "offer_*.db" -mtime +7 -delete
```

Make executable:
```bash
chmod +x /home/ubuntu/backup-db.sh
# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

