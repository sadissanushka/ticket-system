# Deployment Guide 🚀 (Ultra-Low Cost & Risk-Free)

This guide explains how to deploy the IT Help Desk Ticketing System for free, securely, and with zero cold-starts using **Neon**, **AWS EC2**, **Cloudflare**, and **Vercel**.

## 1. Database (PostgreSQL) - [Neon](https://neon.tech/)

Neon offers a generous free tier for serverless PostgreSQL with hard caps, guaranteeing no surprise bills.

1. Create an account on [Neon.tech](https://neon.tech/).
2. Create a new project named `helpdesk`.
3. Copy the **Connection String** (`postgresql://user:password@host/dbname?sslmode=require`).
4. Keep this safe; you'll need it for the backend.

## 2. Backend API - [AWS EC2 Free Tier + Cloudflare + Nginx]

We use a free tier AWS EC2 virtual machine so the backend Node.js server runs 24/7 without sleeping. We place Cloudflare in front of it to provide a secure HTTPS connection.

### Step 2.1: Launch the Server
1. Go to the AWS Console and search for **EC2**.
2. Click **Launch Instances**.
3. **Name:** `it-helpdesk-backend`
4. **OS:** Select **Ubuntu** (Make sure it says "Free tier eligible").
5. **Instance Type:** Select **t2.micro** or **t3.micro** (Free tier eligible).
6. **Key Pair:** Click "Create new key pair", name it `backend-key`, set it to `.pem` format, and download safely.
7. **Network Settings:** Check the boxes for **Allow HTTPS traffic** and **Allow HTTP traffic**.
8. Click **Launch Instance**.

### Step 2.2: Setup Node.js and PM2
1. SSH into your server using your terminal:
   `ssh -i "backend-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP`
2. Run these commands to install Node.js, PM2, and Nginx:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2 typescript ts-node
   ```
3. Clone your GitHub repository and setup the backend:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ticket-system.git
   cd ticket-system/backend
   npm install
   npx prisma generate
   npm run build
   ```
4. Create the `.env` file (`nano .env`) and add your database URL:
   `DATABASE_URL="your-neon-postgres-url"`
   `FRONTEND_URL="https://your-frontend-app.vercel.app"`
   `PORT=5000`
5. Start the backend continuously:
   ```bash
   pm2 start dist/src/index.js --name "helpdesk-backend"
   pm2 save
   pm2 startup
   ```

### Step 2.3: Setup Nginx Reverse Proxy & Cloudflare SSL
1. Open the Nginx config:
   `sudo nano /etc/nginx/sites-available/default`
2. Replace it with EXACTLY this configuration:
   ```nginx
   server {
       listen 80 default_server;
       server_name _;
       client_max_body_size 10M;
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Restart Nginx: `sudo systemctl restart nginx`
4. In **Cloudflare**, ensure your API domain (e.g. `api.yourdomain.com`) is pointing to your EC2 Public IP.
5. In Cloudflare **SSL/TLS -> Overview**, set the mode to **Flexible**.

## 3. Frontend (Next.js) - [Vercel]

Vercel provides the absolute best hosting and edge delivery for Next.js applications for free.

1. Create an account on [Vercel.com](https://vercel.com/) and connect your GitHub.
2. Click **Add New Project** and import this GitHub repository.
3. Vercel will automatically detect `Next.js`.
4. Open **Environment Variables** and add:
   - Variable name: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.yourdomain.com` (Your Cloudflare API URL).
5. Click **Deploy**. Vercel will automatically build and deploy your frontend.

---

## 🔄 CI/CD Pipeline (GitHub Actions)

**Automated Deployments:**
- **Frontend**: Vercel automatically detects pushes to `main` and re-deploys instantly.
- **Backend**: We use GitHub actions (`.github/workflows/ci.yml`) to SSH into your EC2 server and pull new changes automatically.

### Required GitHub Secrets for Backend CI/CD:
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:
1. `EC2_HOST`: The public IP address of your AWS EC2 instance.
2. `EC2_USERNAME`: `ubuntu`
3. `EC2_SSH_KEY`: The entire contents of your downloaded `.pem` file from AWS.

## 📝 Important Notes

- **Always-on API**: Since your backend is hosted on an EC2 instance, it runs 24/7 and won't sleep, providing fast response times at all times.
- **CORS Handling**: The backend automatically reads `FRONTEND_URL` in your `.env` to configure Cross-Origin requests. Ensure it perfectly matches your exact Vercel URL.
