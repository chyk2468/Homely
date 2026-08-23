# 🏢 Homely — Society Maintenance Complaint Tracker & Operations CRM

> A modern, full-stack apartment society maintenance and complaint management platform designed for residents, maintenance staff technicians, and society administrators.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://vitejs.dev/)
[![SQLite/SQLAlchemy](https://img.shields.io/badge/Database-SQLAlchemy_%2B_SQLite-red)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 1. Project Objective & Problem Statement

Apartment societies process continuous streams of resident maintenance complaints (plumbing leaks, electrical failures, elevator breakdowns, masonry seepage). Without a centralized system:
- **Administrators** have no visibility into pending workloads, overdue resolution deadlines, or recurring fault clusters across society wings.
- **Residents** lack visibility into ticket progress, technician dispatch status, and community announcements.
- **Technicians** lack direct assignment queues and contextual ticket notes.

**Homely** solves these challenges by providing:
1. **Resident Portal:** Multi-photo complaint submission with duplicate warning detection, live SLA countdowns, two-way ticket discussions, timeline tracking, and 5-star satisfaction ratings.
2. **Staff Technician Queue:** Trade-specific complaint queues, dispatch remarks, and work progress updates.
3. **Admin Operations CRM:** Full complaint registry, technician assignment, category SLA customization, automated overdue escalation, CSV reporting, audit logs, and smart analytics (recurring issue patterns).
4. **Community Notice Board:** Pinned urgent alerts with in-app notifications and email dispatch.

---

## 🔑 2. Demo Accounts

| Role | Email | Password | Access / Capabilities |
|---|---|---|---|
| **Resident** | `resident@society.com` | `resident123` | Raise tickets with photos, view complaint history, comment, rate service |
| **Maintenance Staff** | `plumber@society.com` | `staff123` | View assigned work orders, update repair progress to In Progress / Resolved |
| **Society Admin** | `admin@society.com` | `admin123` | Assign staff, configure category SLAs, export CSV reports, view analytics |

---

## 🚀 3. Scope of Work & Feature Set

### 🏠 Resident Experience
- **Complaint Submission with Media Uploads:** Categorize issues (Plumbing, Electrical, Elevator, Civil, Pest Control), set descriptions, and attach photo evidence.
- **Proactive Duplicate Detection:** Detects similar open complaints in the same category/location before submission to avoid redundant tickets.
- **Live Lifecycle Timeline:** Full chronological audit log with actor names, status transitions, and notes.
- **Two-Column Ticket View:** Left column for description, gallery, comments, and timeline; right column for SLA countdown badge, technician info, and actions.
- **Resident Satisfaction Ratings:** Submit 1–5 star ratings with feedback comments once complaints are marked *Resolved*.
- **Reopen Request Flow:** Request ticket reopening with justification if a resolved issue recurs.

### 🛠️ Maintenance Staff Workspace
- **Assigned Queue:** Dedicated work order list filtered to the logged-in technician.
- **Status Lifecycle Control:** Transition tickets to *In Progress* or *Resolved* with field remarks.

### ⚙️ Administrative CRM & Smart Analytics
- **Complaints Registry:** Multi-criteria search and filtering (by category, priority, status, SLA overdue).
- **Technician Dispatch:** Assign registered in-house staff or external vendors to open tickets.
- **Category-Specific SLAs:** Customize resolution windows (e.g. Lift: 1 Day, Plumbing: 2 Days, Civil: 5 Days).
- **Automated Overdue Escalation:** Automatically calculates deadlines and flags overdue tickets at the top of queues.
- **Recurring Issue Pattern Detection:** Automatically groups similar complaints over 30 days by location and category to flag recurring structural defects.
- **CSV Data Export:** One-click authenticated CSV download for society auditing.
- **Immutable Admin Audit Ledger:** Records every status change, staff assignment, SLA update, and notice publication.
- **Notice Board Broadcast:** Post general and pinned important notices with instant resident in-app notifications.

---

## 📐 4. System Design & Architectural Write-Up (Max 800 Words)

### A. Complaint Lifecycle & Immutable History Model
Every complaint follows a strict state transition model: `Open` ➔ `In Progress` ➔ `Resolved` (with optional `Reopened` state).
```
   [ Open ] ───────────► [ In Progress ] ───────────► [ Resolved ]
      ▲                                                     │
      │                                                     ▼
      └─────────── [ Approved Reopen Request ] ◄─── (Feedback / Rating)
```
To guarantee accountability, complaints maintain a strict 1-to-many relationship with `complaint_history`. State transitions, priority shifts, technician assignments, and reopen reviews create immutable audit entries storing `action_type`, `old_value`, `new_value`, `changed_by_name`, `changed_by_role`, `notes`, and UTC `timestamp`. Residents only have read access to their own tickets (enforced via SQL user filtering), while administrators have full organizational oversight.

### B. Dynamic SLA & Overdue Detection Engine
Deadlines are calculated using category-specific SLAs (`complaint_categories.sla_days`) or the global society threshold (`settings.overdue_threshold_days`). Upon creation:
$$\text{Deadline} = \text{created\_at} + \text{SLA Days}$$
The system evaluates overdue status both on dynamic query execution and on administrator configuration updates:
$$\text{is\_overdue} = (\text{status} \neq \text{'Resolved'}) \land (\text{utcnow}() > \text{Deadline})$$
Overdue complaints are assigned priority in search queries and surfaced at the top of admin/staff dashboards with soft coral alert badges (`#FCECED` / `#F04B4F`).

### C. Photo Upload & Media Handling
Complaint attachments are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`) and size limits. Files are saved to an isolated `/uploads` directory using UUID-prefixed filenames to prevent collisions and directory traversal attacks. File metadata and relational paths are recorded in `complaint_attachments` and served as static assets.

### D. Notification Flow & Notice Board
The system incorporates a multi-tier notification pipeline:
1. **In-App Notification Bell:** Instant notification records are stored in `in_app_notifications` with unread counter badges.
2. **Email Dispatch Pipeline:** When a ticket status changes or an administrative notice is marked **Important**, an asynchronous broadcast triggers email dispatches to affected residents.

---

## 🗄️ 5. Database Schema

The SQLite/PostgreSQL schema is normalized across 10 relational models:

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "files / assigned_to"
    USERS ||--o{ NOTICES : "publishes"
    USERS ||--o{ IN_APP_NOTIFICATIONS : "receives"
    COMPLAINTS ||--o{ COMPLAINT_HISTORY : "tracks"
    COMPLAINTS ||--o{ COMPLAINT_ATTACHMENTS : "contains"
    COMPLAINTS ||--o{ COMPLAINT_COMMENTS : "has"
    COMPLAINTS ||--o| RESIDENT_FEEDBACK : "receives"
    COMPLAINTS ||--o{ REOPEN_REQUESTS : "logs"

    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role "resident | staff | admin"
        string flat_number
        string phone_number
        string specialization
        boolean is_active
    }

    COMPLAINTS {
        int id PK
        int resident_id FK
        int assigned_to FK
        string title
        string description
        string category
        string status "Open | In Progress | Resolved"
        string priority "Low | Medium | High"
        boolean is_overdue
        datetime created_at
        datetime resolved_at
    }

    COMPLAINT_HISTORY {
        int id PK
        int complaint_id FK
        int changed_by_id FK
        string action_type
        string old_value
        string new_value
        string changed_by_name
        string changed_by_role
        string notes
        datetime timestamp
    }

    COMPLAINT_ATTACHMENTS {
        int id PK
        int complaint_id FK
        string file_path
        string file_name
    }

    COMPLAINT_COMMENTS {
        int id PK
        int complaint_id FK
        int author_id FK
        string message
        datetime created_at
    }

    RESIDENT_FEEDBACK {
        int id PK
        int complaint_id FK
        int resident_id FK
        int rating "1 to 5"
        string comment
        datetime created_at
    }

    REOPEN_REQUESTS {
        int id PK
        int complaint_id FK
        int resident_id FK
        string reason
        string status "Pending | Approved | Rejected"
        string admin_notes
    }

    NOTICES {
        int id PK
        int author_id FK
        string title
        string content
        boolean is_important
        datetime created_at
    }

    CATEGORY_SLAS {
        int id PK
        string name UK
        int sla_days
        boolean is_active
    }

    ADMIN_AUDIT_LOGS {
        int id PK
        int admin_id
        string admin_name
        string action
        string target_entity
        string target_id
        string details
        datetime created_at
    }
```

---

## 📡 6. Complete REST API Reference

### 🔐 Authentication & Profile (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register resident or admin account |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password and obtain JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update full name, phone, flat number, or change password |

### 📋 Complaints Management (`/api/complaints`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/complaints` | Resident | Raise new ticket with multipart photo attachment |
| `POST` | `/api/complaints/check-duplicate` | Resident | Proactively check for potential duplicate complaints |
| `GET` | `/api/complaints` | Authenticated | List complaints (Residents see own; Admins see all) |
| `GET` | `/api/complaints/{id}` | Authenticated | Get ticket details, countdown SLA, photos, and assignments |
| `GET` | `/api/complaints/{id}/history` | Authenticated | Retrieve immutable lifecycle audit history |
| `PATCH` | `/api/complaints/{id}/status` | Admin/Staff | Update ticket status (`Open`, `In Progress`, `Resolved`) |
| `PATCH` | `/api/complaints/{id}/priority` | Admin | Update priority level (`Low`, `Medium`, `High`) |
| `GET` | `/api/complaints/{id}/comments` | Authenticated | Retrieve conversation thread |
| `POST` | `/api/complaints/{id}/comments` | Authenticated | Add message to ticket discussion |
| `POST` | `/api/complaints/{id}/feedback` | Resident | Submit 1–5 star rating and review on resolved tickets |
| `POST` | `/api/complaints/{id}/reopen-request` | Resident | Submit ticket reopen request with reason |

### 🛠️ Maintenance Staff (`/api/staff`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/staff/complaints` | Staff | Retrieve complaints assigned to logged-in technician |
| `PATCH` | `/api/staff/complaints/{id}/status` | Staff | Update assigned work order status with field remarks |

### 👑 Administration & Smart Analytics (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PATCH` | `/api/admin/complaints/{id}/assign` | Admin | Assign or reassign complaint to a staff technician |
| `GET` | `/api/admin/staff` | Admin | List all registered maintenance staff members |
| `POST` | `/api/admin/staff` | Admin | Onboard new technician with trade specialization |
| `PATCH` | `/api/admin/staff/{id}` | Admin | Activate/deactivate staff account or edit details |
| `GET` | `/api/admin/categories` | Admin | List category-specific SLA targets |
| `POST` | `/api/admin/categories` | Admin | Create new category with custom SLA window |
| `PUT` | `/api/admin/categories/{id}` | Admin | Update category SLA resolution days |
| `GET` | `/api/admin/reopen-requests` | Admin | List pending resident reopen requests |
| `PATCH` | `/api/admin/reopen-requests/{id}/review` | Admin | Approve or reject ticket reopen request |
| `GET` | `/api/admin/audit-logs` | Admin | Query immutable administrative event ledger |
| `GET` | `/api/admin/analytics/recurring-issues` | Admin | Detect recurring complaint clusters by location |
| `GET` | `/api/admin/reports/complaints/csv` | Admin | Export filtered complaint records as CSV report |
| `GET` | `/api/dashboard/stats` | Admin | Retrieve comprehensive dashboard analytics & metrics |

### 📢 Notices & Notifications (`/api/notices`, `/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notices` | Authenticated | List notice board announcements (pinned first) |
| `POST` | `/api/notices` | Admin | Publish notice with optional important pinned flag |
| `PUT` | `/api/notices/{id}` | Admin | Edit notice title, content, or pinned state |
| `DELETE` | `/api/notices/{id}` | Admin | Delete announcement |
| `GET` | `/api/notifications` | Authenticated | Get in-app notifications for current user |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get badge count of unread notifications |
| `POST` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 💻 7. Installation & Local Setup Guide

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18.0 or higher
- **npm:** 9.0 or higher

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/chyk2468/Homely.git
cd Homely
```

---

### Step 2: Backend Setup (FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate
# macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env

# 5. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```
> Backend API will be live at `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).

---

### Step 3: Frontend Setup (React 19 + Vite)
In a separate terminal window:
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
> Frontend client will be running at `http://localhost:5173`.

---

## ⚙️ 8. Environment Variables (`.env.example`)

Create a `.env` file in `backend/` with the following variables:

```env
# Application Settings
PROJECT_NAME="Homely - Society Maintenance Complaint Tracker"
SECRET_KEY="super-secret-jwt-key-replace-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Connection (Defaults to SQLite; supports PostgreSQL)
DATABASE_URL="sqlite:///./society_complaints.db"

# CORS Allowed Origins
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,https://homely-*.vercel.app"

# Overdue Escalation Default Threshold (Days)
DEFAULT_OVERDUE_THRESHOLD_DAYS=7

# Email Notification Service (Console / Mock / SMTP)
EMAIL_SERVICE_ENABLED=true
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="notifications@society.com"
SMTP_PASSWORD="app-specific-password"
FROM_EMAIL="Homely Notifications <notifications@society.com>"
```

---

## 🧪 9. Automated Testing Suite

Homely includes automated unit and integration tests covering the complete complaint lifecycle, RBAC data isolation, SLA overdue calculations, duplicate detection, staff assignments, reopen workflows, and profile security:

```bash
# Run pytest in backend directory:
cd backend
pytest tests/ -v
```

**Test Coverage Summary:**
```
======================== 16 passed in ~20s ========================
✓ test_register_and_login_flow
✓ test_auth_me_endpoint
✓ test_create_complaint_with_photo
✓ test_resident_data_isolation
✓ test_admin_can_access_all_complaints
✓ test_status_and_priority_lifecycle
✓ test_category_specific_sla_overdue
✓ test_staff_role_and_assignment
✓ test_complaint_comments
✓ test_resident_satisfaction_feedback
✓ test_reopen_request_flow
✓ test_duplicate_complaint_detection
✓ test_in_app_notifications
✓ test_admin_search_and_csv_export
✓ test_dashboard_smart_analytics
✓ test_update_profile_and_password
```

---

## ☁️ 10. Production Deployment (Vercel & Render)

### Frontend (Vercel)
1. Import repository `https://github.com/chyk2468/Homely.git` into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend` (or root with bundled `vercel.json`).
3. Set Environment Variables:
   - `VITE_API_URL` ➔ `https://your-backend-api.onrender.com/api`
   - `VITE_API_ROOT` ➔ `https://your-backend-api.onrender.com`
4. Click **Deploy**. Single Page Application rewrites are pre-configured.

### Backend (Render / Railway)
1. Deploy a new Web Service pointing to `backend/`.
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
