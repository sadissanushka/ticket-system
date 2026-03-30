# IT Help Desk Ticketing System

A full-stack ticketing system for university IT support, featuring a Node.js/Prisma backend and a Next.js frontend.

- **Real-time Updates**: Instant ticket status changes via Socket.io.

## 👨‍💼 Administrator Tools

### Technician & User Management
For managing staff members (technicians and other admins) directly from the terminal, refer to the [Admin Management Guide](ADMIN_GUIDE.md).

Common commands:
- **Launch Interactive Admin Interface**: Run `npm run admin` from the `backend/` directory.
- **View Staff**: The default view shows a table of all technicians and admins.
- **Add New User**: Press `n` on your keyboard to open the creation form. You can select between `TECHNICIAN` and `ADMIN` roles.
- **Keyboard Shortcuts**:
    *   `n`: Create a new user (Technician or Admin).
    *   `q` / `ctrl+c`: Exit the application.
    *   `esc`: Cancel current form and return to list.

## 🛠️ Tech Stack

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: v18.x or later recommended
- **npm**: v9.x or later
- **Docker & Docker Compose**: For running the PostgreSQL database

---

## 🛠️ Setup Instructions

### 1. Database Setup (Docker)

The project uses PostgreSQL managed via Docker Compose.

```bash
# From the root directory
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# (Optional) Edit .env if your configuration differs

# Prisma Setup (Generate client and push schema to DB)
npx prisma generate
npx prisma db push

# (Optional) Seed the database with initial data
npx prisma db seed

# Start development server
npm run dev
```
*The backend will be running at [http://localhost:5000](http://localhost:5000)*

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*The frontend will be running at [http://localhost:3000](http://localhost:3000)*

---

## 🏗️ Project Structure

- **`/backend`**: Express.js server with Prisma ORM.
- **`/frontend`**: Next.js application with Tailwind CSS and shadcn/ui.
- **`docker-compose.yml`**: Database configuration.

## 📝 Troubleshooting

- **Database Connection**: Ensure Docker is running and port `5432` is not occupied by another service.
- **API URLs**: Currently, the frontend has some hardcoded references to `http://localhost:5000`. Ensure the backend is running on this port.
- **Prisma Errors**: If you change the `schema.prisma` file, remember to run `npx prisma generate` and `npx prisma db push`.

---

## 📄 License
This project is licensed under the ISC License.
