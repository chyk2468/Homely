# 🏢 Homely — Society Maintenance Complaint Tracker & Operations CRM

Homely is a modern, full-stack maintenance complaint tracker and operations CRM for residential apartment communities. It connects **Residents**, **Maintenance Staff**, and **Society Administrators** into a single workflow with SLA countdowns, photo uploads, multi-party discussion threads, and real-time analytics.

---

## 🔑 Demo Accounts (1-Click Login on UI)

The login screen features **1-Click Instant Demo Login** buttons:

| Role | Email | Password | Flat / Specialization | Access Level |
|---|---|---|---|---|
| **Society Admin** | `admin@society.com` | `admin123` | Management Office | Full Admin Portal & Analytics |
| **Maintenance Staff** | `plumber@society.com` | `staff123` | Plumbing Specialist (Ramesh Kumar) | Assigned Work Orders Queue |
| **Maintenance Staff** | `electrician@society.com` | `staff123` | Electrical Specialist (Suresh Verma) | Assigned Work Orders Queue |
| **Resident 1** | `resident@society.com` | `resident123` | Rahul Sharma (Flat A-402, Tower 1) | Resident Portal & Complaints |
| **Resident 2** | `priya@society.com` | `resident123` | Priya Patel (Flat B-701, Tower 2) | Resident Portal & Complaints |

---

## ✨ Key Features

### 👤 For Residents
- **Raise Complaints with Photos:** Submit tickets with category selection, description, and up to 5 photos.
- **Duplicate Warning:** Detects similar complaints before submission to prevent duplicate tickets.
- **Live SLA Tracking:** Real-time countdown badge indicating time remaining or overdue status.
- **Discussion Thread:** Coordinate with assigned staff and society admins directly on the ticket.
- **Satisfaction Rating & Reopen:** Submit 1–5 star ratings on resolved complaints or request a ticket reopen if issues persist.
- **Notice Board:** View society announcements and pinned notices.

### 👷 For Maintenance Staff
- **Dedicated Workspace:** View and filter assigned work orders (`Open`, `In Progress`, `Resolved`).
- **Operational Updates:** Update ticket status, record maintenance remarks, and participate in discussion threads.

### 🛡️ For Society Administrators
- **Executive Analytics:** Average resolution time, resolution rate (%), overdue rate (%), SLA compliance rate, and technician workload.
- **Staff Assignment:** Assign specific maintenance staff to complaints based on trade specialization.
- **Custom Category SLAs:** Configure custom resolution windows (e.g., Elevator: 1 day, Plumbing: 2 days, Civil: 4 days).
- **Audit Logs & CSV Reports:** Immutable administrative ledger and one-click CSV export of complaints.
- **Notice Broadcasts:** Publish notices and trigger in-app and email notifications.

---

## 🚀 Quickstart

### ⚡ 1-Click Launch (Windows)
Double-click or run:
```cmd
start.bat
```
*(To stop all running services, run `stop.bat`)*

---

### 💻 Manual Setup

#### 1. Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: **http://localhost:8000/docs**

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web App: **http://localhost:5173**

---

## 🧪 Testing

Run backend tests (15 test suites):
```bash
cd backend
.\venv\Scripts\pytest -v
```

---

## ☁️ Deployment

### Frontend (Vercel)
1. Import repository to **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add environment variables:
   - `VITE_API_URL` = `https://your-backend-url.com/api`
   - `VITE_API_ROOT` = `https://your-backend-url.com`
5. Click **Deploy**.

### Backend (Render / Railway / Docker)
1. Deploy as a Web Service from the `backend` folder.
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variable `SECRET_KEY`.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 8, Lucide Icons, Vanilla CSS Design System with Glassmorphism.
- **Backend:** FastAPI, Python 3.11, Pydantic v2, SQLAlchemy 2.0.
- **Database:** SQLite (default) / PostgreSQL compatible.
- **Security:** BCrypt password hashing, Stateless JWT Bearer tokens, Role-Based Access Control (RBAC).
