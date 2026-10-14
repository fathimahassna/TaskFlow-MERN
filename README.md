# TaskFlow &mdash; Enterprise Task Management Platform

> *"Plan smarter. Work better. Achieve more."*

TaskFlow is a modern, production-grade, full-stack **MERN** (MongoDB, Express, React, Node.js) SaaS task management application engineered for high-velocity teams. Inspired by the visual elegance and productivity workflows of **Linear** and **Notion**, TaskFlow features strict role-based access control (RBAC), live interactive analytics via **Recharts**, automated **Nodemailer** email dispatch with offline fallbacks, server-side pagination and search, and an accessible Tailwind CSS design system.

Built for the **MERN Stack Intern Technical Assessment** at **Xplore Intellects**.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Authentication & RBAC Rules](#-authentication--rbac-rules)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Project Structure](#-architecture--project-structure)
5. [Prerequisites](#-prerequisites)
6. [Installation & Setup](#-installation--setup)
7. [Environment Variables](#-environment-variables)
8. [MongoDB Atlas Setup Guide](#-mongodb-atlas-setup-guide)
9. [Secure Admin Account Configuration](#-secure-admin-account-configuration)
10. [SMTP Email Configuration](#-smtp-email-configuration)
11. [Running the Application](#-running-the-application)
12. [REST API Documentation](#-rest-api-documentation)
13. [Security Best Practices](#-security-best-practices)
14. [Troubleshooting Guide](#-troubleshooting-guide)

---

## ✨ Core Features

### 🔐 Authentication & Role-Based Authorization
- **Designated Single Admin Model**: Only the designated administrative account configured in environment variables can access administrative functions.
- **Employee Self-Registration**: Any corporate team member can self-register using their full name, email, password, and confirm password.
- **Server-Enforced Role Assignment**: The backend strictly assigns `role: 'employee'` during self-registration, discarding any client-supplied role values.
- **Split-Screen Sign-In & Onboarding**: Modern SaaS split-screen layout with tabs for **"Sign In"** and **"Register Employee"**, plus 1-click **Demo Login** buttons for assessment evaluations.
- **Hardened Security**: Passwords hashed with `bcryptjs` (salt rounds = 10); signed stateless JWT tokens; client-side route guards and server-side role middleware preventing unauthorized access or role spoofing.

### 📊 Admin Orchestration & Analytics
- **Live Aggregated Telemetry**: Real-time MongoDB counts for Total Tasks, Not Started, In Progress, Completed, High Priority, and Active Employees.
- **Interactive Recharts**:
  - *Task Status Distribution*: Interactive donut chart with percentages and tooltips.
  - *Priority Allocation*: Bar chart highlighting urgency distribution (High, Medium, Low).
  - *Employee Workloads*: Visual progress tracking per team member.
- **Employee Directory**: Manage staff accounts, search by name/department, view task load, edit credentials, or toggle active/inactive access.
- **Complete Task Lifecycle**: Create, assign, edit, filter, search, view audit history, and safely delete tasks with confirmation dialogs.

### 👷 Employee Execution Portal
- **Personalized Workspace**: Personalized welcome banner, velocity progress gauge, upcoming deadline milestones, and workload breakdown.
- **Strict Isolation**: Employees can only view and update tasks specifically assigned to their MongoDB user account.
- **My Tasks Module**: View assigned tasks, filter by priority or status, inspect details, and update status in real-time (`Not Started` -> `Pending` -> `In Progress` -> `Completed`).
- **Automated Alerts**: Updating a task status automatically notifies Administrators via in-app notifications and email dispatch.
- **Accomplishments Showcase**: Dedicated page archiving all completed tasks and achievements.

### 📧 Email Notification Pipeline
- **Nodemailer Integration**: Professional branded HTML emails for:
  1. **Task Assignment**: Dispatched to the employee with task title, description, priority, due date, and login CTA.
  2. **Status Transitions**: Dispatched to the Administrator when an employee marks progress.
- **Non-Blocking Graceful Fallback**: If SMTP is not yet configured, TaskFlow records the event safely to console logs and in-app notifications without crashing or aborting the database transaction.

### ⚡ Performance, Search & Pagination
- **Server-Side Pagination**: Indexed limit-offset pagination (default 10 items) preventing browser overhead.
- **Debounced Search**: Multi-field regex search across title, description, and employee name without API flooding.
- **Skeleton Loading States**: Smooth animated pulse skeletons for stat cards, tables, and detail modals.

---

## 🔒 Authentication & RBAC Rules

1. **Designated Admin Exclusivity**: Only the configured administrator account (`ADMIN_EMAIL`) can access the Admin dashboard and Admin endpoints.
2. **No Public Admin Registration**: Public users cannot register as Admin. Any registration attempting to use `ADMIN_EMAIL` is rejected.
3. **Employee Self-Registration**: Public self-registration requires Name, Email, Password, and matching Confirm Password.
4. **Validation & Duplicate Prevention**: Rejects invalid email formats, passwords shorter than 6 characters, password mismatches, and duplicate emails.
5. **Database Persistence**: Registered employees are persisted in MongoDB with `role: 'employee'`.
6. **Bcrypt Hashing**: Passwords are automatically hashed via Mongoose pre-save hooks before saving.
7. **Role Tamper Protection**: Any `role` sent in request bodies during self-registration is strictly discarded.
8. **Task Boundary Isolation**: Employees can strictly access only tasks where `assignedTo == req.user._id`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19 / 18, Vite, JavaScript, Tailwind CSS, React Router DOM v7, Axios, Lucide React, Framer Motion, Recharts, React Hot Toast |
| **Backend** | Node.js (v20+ / v24+), Express.js, Mongoose, JSON Web Tokens (JWT), bcryptjs, Nodemailer, Helmet, CORS, Express Rate Limit, Morgan |
| **Database** | MongoDB Atlas / Local MongoDB (with automated embedded MongoDB Memory Server fallback) |

---

## 📁 Architecture & Project Structure

```text
taskflow/
├── backend/
│   ├── config/
│   │   └── db.js                 # Dual MongoDB Atlas & Memory Server connection logic
│   ├── controllers/
│   │   ├── authController.js     # Login, employee self-registration, session verification
│   │   ├── dashboardController.js# Aggregated Recharts analytics for Admin & Employee
│   │   ├── employeeController.js # Staff directory CRUD and workload statistics
│   │   ├── notificationController.js # In-app notification retrieval & read status
│   │   └── taskController.js     # Task creation, assignment, status update, deletion
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token verification & active user lookup
│   │   ├── errorMiddleware.js    # Centralized 404 & Mongoose error handling
│   │   ├── rateLimiter.js        # IP rate limiting for authentication routes
│   │   └── roleMiddleware.js     # Strict Designated Admin & Employee role enforcement
│   ├── models/
│   │   ├── Notification.js       # In-app alert notification schema
│   │   ├── Task.js               # Task schema with indexes & references
│   │   └── User.js               # User schema with bcrypt hooks & password match
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth (login, register, me, logout)
│   │   ├── dashboardRoutes.js    # /api/dashboard
│   │   ├── employeeRoutes.js     # /api/employees
│   │   ├── notificationRoutes.js # /api/notifications
│   │   ├── systemRoutes.js       # /api/system
│   │   └── taskRoutes.js         # /api/tasks
│   ├── services/
│   │   └── emailService.js       # Nodemailer HTML templates & dispatch engine
│   ├── utils/
│   │   └── seed.js               # Automated database seeder with rich demo records
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express server bootstrap & route mounting
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI design system
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state, login, register, JWT
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # App shell with sidebar, navbar, toasts & modal
│   │   ├── pages/
│   │   │   ├── admin/            # Admin Dashboard, Tasks, Employees, Settings
│   │   │   ├── employee/         # Employee Dashboard, Tasks, Completed, Profile
│   │   │   ├── LoginPage.jsx     # Split-screen sign-in & employee registration tabs
│   │   │   └── NotFoundPage.jsx  # 404 fallback page
│   │   ├── services/
│   │   │   └── api.js            # Axios client with request & response interceptors
│   │   ├── App.jsx               # Protected route tree & role guards
│   │   ├── index.css             # Tailwind base styles & custom scrollbars
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

---

## 💻 Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ / v24+ recommended)
- **npm**: v9.0.0 or higher
- *(Optional)* **MongoDB Atlas** account for cloud database connection.

---

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-github-repo-url>
   cd taskflow
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## ⚙️ Environment Variables

Create `backend/.env` from the template:

```bash
cd backend
cp .env.example .env
```

Configuration reference:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
# Leave empty to automatically fallback to embedded in-memory MongoDB
MONGODB_URI=

# JWT Secrets
JWT_SECRET=taskflow-super-secret-jwt-key-intern-assessment-2026
JWT_EXPIRES_IN=7d

# Frontend Base URL
FRONTEND_URL=http://localhost:5173

# Designated Single Admin Account Configuration
ADMIN_EMAIL=admin@taskflow.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Alexander Wright
ADMIN_DEPARTMENT=Executive Leadership

# Admin Notification Recipient
ADMIN_NOTIFICATION_EMAIL=admin@taskflow.com

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@taskflow.com
```

---

## 🗄️ MongoDB Atlas Setup Guide

To connect TaskFlow to a live cloud database on MongoDB Atlas:

1. **Create an Atlas Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
   - Click **Create Deployment** and select the free **M0 Shared Sandbox** cluster.
   - Choose your preferred cloud provider (AWS/GCP) and region closest to you.
2. **Create a Database User**:
   - In the left sidebar, click **Database Access** under the Security section.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: e.g. `taskflow_user`.
   - Password: click **Autogenerate Secure Password** or enter your own strong password.
   - Built-in Role: **Read and write to any database**.
   - Click **Add User**.
3. **Configure Network Whitelist**:
   - Click **Network Access** under Security.
   - Click **Add IP Address**.
   - For evaluation/testing, choose **Allow Access From Anywhere** (`0.0.0.0/0`) or **Add Current IP Address**.
   - Click **Confirm**.
4. **Obtain Connection String**:
   - Return to **Clusters** / **Database Deployments**.
   - Click the **Connect** button next to your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection URI:
     ```text
     mongodb+srv://taskflow_user:<password>@cluster0.abcde.mongodb.net/taskflow?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.
5. **Configure Backend `.env`**:
   - Open `backend/.env` and paste your URI:
     ```env
     MONGODB_URI=mongodb+srv://taskflow_user:MySecurePass123@cluster0.abcde.mongodb.net/taskflow?retryWrites=true&w=majority
     ```
6. **Start or Seed**:
   - Run `npm run seed --prefix backend` to initialize collections with default records.
   - When the backend starts, you will see:
     `[TaskFlow DB] Connected successfully to MongoDB Atlas`

---

## 🛡️ Secure Admin Account Configuration

TaskFlow enforces a **Single Designated Administrator** security pattern:

1. **How it Works**:
   - The designated Admin account is configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.
   - Public self-registration (`POST /api/auth/register`) rejects any attempt to register with `ADMIN_EMAIL`.
   - The `requireAdmin` middleware checks:
     `req.user.role === 'admin' && req.user.email === process.env.ADMIN_EMAIL`
   - Even if someone attempts to manipulate JWT payloads or frontend URLs, non-matching users are blocked with `403 Forbidden`.
2. **Setting Up Your Admin Credentials**:
   - In `backend/.env`:
     ```env
     ADMIN_EMAIL=your_executive_email@company.com
     ADMIN_PASSWORD=SuperStrongAdminSecret!456
     ADMIN_NAME=Director Name
     ADMIN_DEPARTMENT=Executive Leadership
     ```
   - Run the seeder to persist this administrator into your database:
     ```bash
     cd backend
     npm run seed
     ```
   - The password is automatically hashed with `bcryptjs` (10 rounds) before being stored in MongoDB.

---

## ✉️ SMTP Email Configuration

TaskFlow is configured to use Nodemailer for transactional emails. To connect real email sending:

### Option A: Gmail
1. Enable 2-Step Verification on your Google Account.
2. Generate an **App Password** (Google Account -> Security -> App passwords).
3. Set your `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_gmail_address@gmail.com
   SMTP_PASS=your_16_digit_app_password
   SMTP_FROM=noreply@taskflow.com
   ADMIN_NOTIFICATION_EMAIL=your_admin_email@gmail.com
   ```

### Option B: Mailtrap (Recommended for Development Testing)
1. Sign up for free at [Mailtrap.io](https://mailtrap.io).
2. Create an Email Testing Inbox and copy the SMTP credentials:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_user
   SMTP_PASS=your_mailtrap_password
   ```

> **Note on Missing Credentials**: If SMTP settings are left empty, the application handles it smoothly! Tasks are saved to the database without delay, a polite notice informs the UI, and the dispatch payload is logged cleanly to the terminal.

---

## 🏃 Running the Application

### Option 1: Using Root Scripts
From the project root:
```bash
# Terminal 1 - Start Backend API
npm run dev:backend

# Terminal 2 - Start Frontend Vite Server
npm run dev:frontend
```

### Option 2: Running Directly
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

- **Frontend Application**: `http://localhost:5174` (or `http://localhost:5173`)
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

### Re-seeding Data manually
```bash
cd backend
npm run seed
```

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` &mdash; Public Employee self-registration (Name, Email, Password, ConfirmPassword). Server enforces `role: 'employee'`.
- `POST /api/auth/login` &mdash; Authenticates user and returns JWT token + profile.
- `GET /api/auth/me` &mdash; Returns current authenticated user record *(Protected)*.
- `POST /api/auth/logout` &mdash; Cleans up session *(Protected)*.

### Tasks (`/api/tasks`)
- `GET /api/tasks` &mdash; Paginated & filtered task listing *(Admins see all; Employees see own)*.
- `POST /api/tasks` &mdash; Creates task, assigns employee, sends email notification *(Admin Only)*.
- `GET /api/tasks/:id` &mdash; Retrieves single task details *(Protected)*.
- `PUT /api/tasks/:id` &mdash; Updates task specifications and assignee *(Admin Only)*.
- `PATCH /api/tasks/:id/status` &mdash; Updates status; triggers email to Admin *(Employee or Admin)*.
- `DELETE /api/tasks/:id` &mdash; Permanently deletes task and notifications *(Admin Only)*.

### Employees (`/api/employees`) &mdash; *Admin Only*
- `GET /api/employees` &mdash; Paginated staff directory with live task completion counts.
- `GET /api/employees/dropdown` &mdash; Lightweight active employee list for assignment pickers.
- `POST /api/employees` &mdash; Registers employee account directly from Admin portal.
- `GET /api/employees/:id` &mdash; Retrieves employee profile and assigned tasks.
- `PUT /api/employees/:id` &mdash; Updates employee credentials or department.
- `PATCH /api/employees/:id/status` &mdash; Toggles active/inactive account access.

### Dashboard Telemetry (`/api/dashboard`)
- `GET /api/dashboard/admin` &mdash; Live counts, Recharts distribution arrays, recent activity *(Designated Admin Only)*.
- `GET /api/dashboard/employee` &mdash; Personal metrics, completion percentage, upcoming deadlines *(Protected)*.

### Notifications & System (`/api/notifications`, `/api/system`)
- `GET /api/notifications` &mdash; User's in-app alerts with unread counter.
- `PATCH /api/notifications/:id/read` &mdash; Marks alert as read.
- `PATCH /api/notifications/read-all` &mdash; Marks all alerts as read.
- `GET /api/system/status` &mdash; Database and SMTP diagnostic information *(Admin Only)*.

---

## 🔒 Security Best Practices

1. **Password Hashing**: Pre-save Mongoose hook using `bcryptjs` with 10 salt rounds. Passwords are set with `select: false` so hashes are never exposed in queries.
2. **JWT Route Protection**: Token verified on every protected request. Inactive or deleted users are rejected immediately.
3. **Role Authorization Middleware**: Frontend route changes cannot bypass backend security. Non-admin calls to `/api/employees` or `POST /api/tasks` return `403 Forbidden`.
4. **Rate Limiting**: `express-rate-limit` prevents brute-force login and registration attempts (30 attempts per 15 minutes).
5. **No Credentials in Version Control**: `.env` and sensitive files are strictly excluded via `.gitignore`.

---

## 📄 License
This project was developed for technical demonstration and assessment purposes. MIT License.