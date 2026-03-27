# Deployment Guide 🚀

This guide explains how to deploy the IT Help Desk Ticketing System for free using **Neon**, **AWS EC2**, and **Vercel**.

## 1. Database (PostgreSQL) - [Neon](https://neon.tech/)

Neon offers a generous free tier for serverless PostgreSQL with hard caps, guaranteeing no surprise bills.

1. Create an account on [Neon.tech](https://neon.tech/).
2. Create a new project named `helpdesk`.
3. Copy the **Connection String** (`postgresql://user:password@host/dbname?sslmode=require`).
4. Keep this safe; you'll need it for the backend.

## 2. Backend (Express.js) - [AWS EC2 Free Tier]

We use a free tier AWS EC2 virtual machine so the backend runs 24/7 without sleeping.

### Step 2.1: Launch the Server
1. Go to the AWS Console and search for **EC2**.
2. Click **Launch Instances**.
3. **Name:** `it-helpdesk-backend`
4. **OS:** Select **Ubuntu** (Make sure it says "Free tier eligible", usually Ubuntu 24.04 or 22.04 LTS).
5. **Instance Type:** Select **t2.micro** or **t3.micro** (Free tier eligible).
6. **Key Pair:** Click "Create new key pair", name it `backend-key`, set it to `.pem` format, and download it safely to your computer.
7. **Network Settings:** Check the boxes for **Allow HTTPS traffic from the internet** and **Allow HTTP traffic from the internet**. Click **Edit**, Add a Custom TCP rule for Port **5000** (Anywhere `0.0.0.0/0`).
8. Click **Launch Instance**.

### Step 2.2: Setup the Server
1. SSH into your server using your terminal:
   `ssh -i "backend-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP`
2. Run these commands to install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   sudo npm install -g typescript ts-node
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

## 3. Frontend (Next.js) - [Vercel](https://vercel.com/)

Vercel is the best place to host Next.js apps.

1.  Create an account on [Vercel.com](https://vercel.com/).
2.  Click **Add New** > **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset**: `Next.js`
    - **Root Directory**: `frontend`
5.  Add **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: `http://YOUR_EC2_PUBLIC_IP:5000` (Your EC2 backend URL)
6.  Click **Deploy**.

---

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions workflow in `.github/workflows/ci.yml`. 

- **Automated Builds**: Every time you push to `main` or create a Pull Request, GitHub will automatically check if both the frontend and backend build correctly.
- **Continuous Deployment**: 
    - **EC2 Backend**: You will need to pull changes manually on the server or use a GitHub Action for deployment.
    - **Vercel** will automatically re-deploy your frontend when you push to `main`.

## 📝 Important Notes

- **Always-on**: Since your backend is hosted on an EC2 instance, it runs 24/7 and won't sleep, providing fast response times at all times.
- **CORS**: Ensure the `FRONTEND_URL` in your backend `.env` matches your actual Vercel deployment URL exactly.
