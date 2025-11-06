# Commands to Run on AWS Ubuntu Instance

Copy and paste these commands one by one on your AWS Ubuntu instance.

## Step 1: Update System and Install Node.js

```bash
sudo apt update && sudo apt upgrade -y
```

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

```bash
sudo apt install -y nodejs
```

```bash
node --version
npm --version
```

## Step 2: Install PM2

```bash
sudo npm install -g pm2
```

## Step 3: Navigate to Home Directory and Clone/Upload Code

**Option A: If using Git:**
```bash
cd /home/ubuntu
git clone YOUR_REPOSITORY_URL offer
cd offer
```

**Option B: If uploading via SCP from your local machine:**
```bash
# Run this on YOUR LOCAL MACHINE (Windows PowerShell):
# scp -i your-key.pem -r C:\Users\Alok0\offer ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

Then on AWS:
```bash
cd /home/ubuntu/offer
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Create .env File

```bash
nano .env
```

Press `Ctrl+X`, then `Y`, then `Enter` to save after adding:
```
PORT=3000
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
ADMIN_PASSWORD=your_secure_password_here
NODE_ENV=production
```

**OR generate random secret automatically:**
```bash
echo "PORT=3000" > .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
echo "ADMIN_PASSWORD=admin123" >> .env
echo "NODE_ENV=production" >> .env
```

**Then edit to change password:**
```bash
nano .env
```

## Step 6: Create Logs Directory

```bash
mkdir -p logs
```

## Step 7: Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

```bash
pm2 save
```

```bash
pm2 startup
```

**Copy and run the command that PM2 outputs** (it will look like: `sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu`)

## Step 8: Check if App is Running

```bash
pm2 status
```

```bash
pm2 logs
```

Press `Ctrl+C` to exit logs.

## Step 9: Install Nginx

```bash
sudo apt install -y nginx
```

## Step 10: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/offer-platform
```

**Paste this configuration** (replace YOUR_EC2_IP or YOUR_DOMAIN):
```
server {
    listen 80;
    server_name YOUR_EC2_IP_OR_DOMAIN;

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

Press `Ctrl+X`, then `Y`, then `Enter` to save.

## Step 11: Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/offer-platform /etc/nginx/sites-enabled/
```

```bash
sudo nginx -t
```

```bash
sudo systemctl restart nginx
```

```bash
sudo systemctl enable nginx
```

## Step 12: Configure Firewall

```bash
sudo ufw allow 22/tcp
```

```bash
sudo ufw allow 80/tcp
```

```bash
sudo ufw allow 443/tcp
```

```bash
sudo ufw enable
```

```bash
sudo ufw status
```

## Step 13: Test Your Application

```bash
curl http://localhost:3000
```

**Open in browser:** `http://YOUR_EC2_IP_ADDRESS`

## Step 14: (Optional) Set Up SSL with Let's Encrypt

**Only if you have a domain name pointing to your server:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

```bash
sudo certbot --nginx -d your-domain.com
```

## Useful Commands for Later

**View logs:**
```bash
pm2 logs
```

**Restart app:**
```bash
pm2 restart all
```

**Check status:**
```bash
pm2 status
```

**View Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Stop app:**
```bash
pm2 stop all
```

**Start app:**
```bash
pm2 start all
```

