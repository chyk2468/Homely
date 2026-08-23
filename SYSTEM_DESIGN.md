# System Design Document: Homely (Society Maintenance Complaint Tracker & Operations CRM)

## 1. Architectural Overview
The system follows a modular, decoupled full-stack architecture built with a **FastAPI backend** (Python 3.11+), a **Vite + React SPA frontend**, and a **relational database** (SQLite/PostgreSQL) managed via **SQLAlchemy 2.0 ORM**. Role-Based Access Control (RBAC) strictly separates *Resident*, *Maintenance Staff*, and *Admin* workflows using stateless JWT bearer authentication.

```
[React SPA] <---(JWT / REST / Multipart)---> [FastAPI Backend] <---> [SQLAlchemy 2.0 ORM] <---> [Relational DB]
                                                    │
                                                    ├──> [Storage: Local /uploads | Object Storage]
                                                    └──> [Email Service: Resend REST API]
```

---

## 2. RBAC Roles & Capabilities Matrix

```mermaid
graph TD
    User([Authenticated User])
    User -->|Role: resident| Resident[Resident Persona]
    User -->|Role: staff| Staff[Staff Persona]
    User -->|Role: admin| Admin[Admin Persona]

    Resident --> R1[Raise Complaint & Upload Up to 5 Photos]
    Resident --> R2[View Own Complaints & SLA Countdown]
    Resident --> R3[Post Comments & Discuss with Staff/Admin]
    Resident --> R4[Submit 1-5 Star Satisfaction Rating on Resolved]
    Resident --> R5[Submit Reopen Request if Issue Persists]

    Staff --> S1[View Assigned Work Orders Queue]
    Staff --> S2[Update Status: Open -> In Progress -> Resolved]
    Staff --> S3[Post Maintenance Remarks & Coordinate via Discussion]

    Admin --> A1[Assign Staff & Review Reopen Requests]
    Admin --> A2[Configure Category-Specific SLA Days]
    Admin --> A3[Manage Staff Technicians & Onboarding]
    Admin --> A4[Smart Analytics: Resolution Time, Workload, Overdue %]
    Admin --> A5[View Immutable Admin Audit Logs & Export CSV Reports]
    Admin --> A6[Publish Notices & Broadcast Announcements]
```

---

## 3. Complaint Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Open: Resident Submits Complaint (ActionType.CREATED)
    Open --> In_Progress: Admin Assigns Staff or Staff Starts Job (ActionType.STATUS_CHANGED / ASSIGNED)
    In_Progress --> Resolved: Staff / Admin Marks Resolved (ActionType.STATUS_CHANGED)
    
    Resolved --> FeedbackSubmitted: Resident Rates Satisfaction (1-5 Stars)
    Resolved --> ReopenPending: Resident Submits Reopen Request (ActionType.REOPEN_REQUESTED)
    
    ReopenPending --> In_Progress: Admin Approves Reopen (ActionType.REOPENED)
    ReopenPending --> Resolved: Admin Rejects Reopen (ActionType.REOPEN_REJECTED)
```

---

## 4. Category-Specific SLA & Overdue Calculation Engine

Each complaint category has a configured SLA resolution window stored in `complaint_categories` (fallback to global `settings.overdue_threshold_days` or default 7 days):

$$\text{Deadline} = \text{created\_at} + (\text{Category SLA Days} \times 86,400\text{s})$$

$$\text{Remaining Seconds} = \text{Deadline} - \text{Current UTC Time}$$

$$\text{is\_overdue} = (\text{status} \neq \text{'Resolved'}) \land (\text{Remaining Seconds} < 0)$$

- **SLA Status Badges:**
  - `normal`: $\text{Remaining Seconds} > 86,400\text{s}$ (Cyan/Emerald badge)
  - `approaching`: $0 \le \text{Remaining Seconds} \le 86,400\text{s}$ (Amber badge)
  - `overdue`: $\text{Remaining Seconds} < 0$ (Rose/Flame badge)
  - `resolved`: Complaint is resolved (Emerald badge)

---

## 5. Duplicate & Recurring Issue Detection Algorithm

1. **Duplicate Detection:**
   - Evaluates complaints created in the past 30 days within the same category.
   - Computes token overlap (Jaccard similarity $\ge 0.35$) between cleaned title and description keywords.
   - Returns non-blocking potential duplicate list for resident review before final submission.

2. **Recurring Issue Hotspot Detection:**
   - Groups complaints across 30-day windows by Category and Location (Flat or Tower).
   - Identifies clusters with $\ge 2$ occurrences and flags them as recurring maintenance patterns.

---

## 6. Complete Database Schema (Entity-Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ complaints : "raises (resident)"
    users ||--o{ complaints : "assigned_to (staff)"
    users ||--o{ complaint_history : "logs action"
    users ||--o{ complaint_comments : "authors"
    users ||--o{ complaint_feedback : "submits"
    users ||--o{ reopen_requests : "requests / reviews"
    users ||--o{ notifications : "receives"
    users ||--o{ admin_audit_logs : "admin actor"
    users ||--o{ notices : "publishes"

    complaints ||--o{ complaint_history : "has"
    complaints ||--o{ complaint_comments : "has"
    complaints ||--o{ complaint_attachments : "has"
    complaints ||--o{ reopen_requests : "has"
    complaints ||--o| complaint_feedback : "has"
    complaint_categories ||--o{ complaints : "categorizes"

    users {
        int id PK
        string email UK
        string full_name
        string password_hash
        string role "resident | staff | admin"
        string flat_number
        string phone_number
        string specialization
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    complaint_categories {
        int id PK
        string name UK
        int sla_days
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    complaints {
        int id PK
        int resident_id FK
        int assigned_to FK
        string title
        string category
        string description
        string photo_url
        string status "Open | In Progress | Resolved"
        string priority "Low | Medium | High"
        boolean is_overdue
        datetime assigned_at
        datetime created_at
        datetime updated_at
        datetime resolved_at
    }

    complaint_attachments {
        int id PK
        int complaint_id FK
        string file_path
        string file_name
        int file_size
        string mime_type
        datetime created_at
    }

    complaint_comments {
        int id PK
        int complaint_id FK
        int author_id FK
        string author_name
        string author_role
        string message
        datetime created_at
    }

    complaint_feedback {
        int id PK
        int complaint_id FK
        int resident_id FK
        int rating "1 to 5"
        string comment
        datetime created_at
    }

    reopen_requests {
        int id PK
        int complaint_id FK
        int resident_id FK
        string reason
        string status "Pending | Approved | Rejected"
        int reviewed_by FK
        string admin_notes
        datetime created_at
        datetime reviewed_at
    }

    notifications {
        int id PK
        int user_id FK
        string title
        string message
        string type "STATUS_UPDATE | ASSIGNMENT | IMPORTANT_NOTICE | REOPEN | COMMENT | FEEDBACK"
        int related_complaint_id FK
        int related_notice_id FK
        boolean is_read
        datetime created_at
    }

    admin_audit_logs {
        int id PK
        int admin_id FK
        string admin_name
        string action
        string target_entity
        string target_id
        string details
        datetime created_at
    }

    complaint_history {
        int id PK
        int complaint_id FK
        int actor_id FK
        string actor_name
        string actor_role
        string action_type
        string old_status
        string new_status
        string old_priority
        string new_priority
        string note
        datetime created_at
    }

    notices {
        int id PK
        int author_id FK
        string title
        string content
        boolean is_important
        datetime created_at
        datetime updated_at
    }

    settings {
        int id PK
        string key UK
        string value
        string description
        datetime updated_at
    }
```

---

## 7. Secure Photo Pipeline & Verification
- **Validation:** Enforces maximum 5 photos per complaint (&le; 10MB each), whitelisted MIME signatures (`image/jpeg`, `image/png`, `image/webp`).
- **File Sanitization:** Stored with cryptographically generated `UUIDv4` identifiers to eliminate directory traversal risks.
- **Asynchronous Chunk Streaming:** Handled using `aiofiles` in non-blocking 1MB chunks.
