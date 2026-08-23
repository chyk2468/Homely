import io
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategoryModel,
    ComplaintComment,
    ComplaintFeedback,
    ReopenRequest,
    ActionType
)
from app.models.notice import Notice
from app.models.notification import Notification, NotificationType
from app.models.audit_log import AdminAuditLog
from app.models.setting import Setting
from app.services.auth_service import get_password_hash

# In-memory SQLite DB with StaticPool
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Admin
    admin = User(
        email="testadmin@society.com",
        full_name="Test Admin",
        password_hash=get_password_hash("adminpass123"),
        role=UserRole.ADMIN.value,
        flat_number="Admin Office",
        is_active=True
    )
    # 2. Resident 1
    resident1 = User(
        email="testresident1@society.com",
        full_name="Resident One",
        password_hash=get_password_hash("residentpass123"),
        role=UserRole.RESIDENT.value,
        flat_number="101-A",
        is_active=True
    )
    # 3. Resident 2
    resident2 = User(
        email="testresident2@society.com",
        full_name="Resident Two",
        password_hash=get_password_hash("residentpass123"),
        role=UserRole.RESIDENT.value,
        flat_number="202-B",
        is_active=True
    )
    # 4. Staff (Plumber)
    staff = User(
        email="teststaff@society.com",
        full_name="Staff Plumber",
        password_hash=get_password_hash("staffpass123"),
        role=UserRole.STAFF.value,
        specialization="Plumbing",
        is_active=True
    )
    db.add_all([admin, resident1, resident2, staff])

    # Category SLAs
    db.add_all([
        ComplaintCategoryModel(name="Plumbing", sla_days=2, is_active=True),
        ComplaintCategoryModel(name="Electrical", sla_days=2, is_active=True),
        ComplaintCategoryModel(name="Elevator", sla_days=1, is_active=True),
        ComplaintCategoryModel(name="Civil", sla_days=4, is_active=True),
    ])

    db.add(Setting(
        key="overdue_threshold_days",
        value="7",
        description="Global default overdue threshold"
    ))

    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

# 1. Health check
def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

# 2. Resident Registration & Login
def test_resident_registration_and_login():
    reg_res = client.post("/api/auth/register", json={
        "email": "newresident@society.com",
        "full_name": "New Resident",
        "password": "password123",
        "flat_number": "303-C",
        "phone_number": "+91 99999 88888",
        "role": "resident"
    })
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.json()
    assert reg_res.json()["user"]["email"] == "newresident@society.com"

    login_res = client.post("/api/auth/login", json={
        "email": "newresident@society.com",
        "password": "password123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

# 3. Resident creates complaint (with photo, category, and SLA calculation)
def test_resident_create_complaint_with_photo():
    res_login = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_image = io.BytesIO(b"fake image data payload for test")
    fake_image.name = "test_pipe.jpg"

    response = client.post(
        "/api/complaints",
        data={
            "title": "Broken pipe in bathroom",
            "category": "Plumbing",
            "description": "Water overflowing from main line"
        },
        files={"photo": ("test_pipe.jpg", fake_image, "image/jpeg")},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Broken pipe in bathroom"
    assert data["category"] == "Plumbing"
    assert data["status"] == "Open"
    assert data["priority"] == "Medium"
    assert data["is_overdue"] is False
    assert data["photo_url"] is not None
    assert data["photo_url"].startswith("/uploads/")
    assert data["category_sla_days"] == 2
    assert "deadline" in data
    assert data["sla_status"] == "normal"

# 4. Resident Data Isolation: Cannot view or access another resident's complaint
def test_resident_data_isolation():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    res1_headers = {"Authorization": f"Bearer {res1_token}"}

    create_res = client.post(
        "/api/complaints",
        data={"title": "Resident 1 Issue", "category": "Civil", "description": "Wall crack"},
        headers=res1_headers
    )
    cid = create_res.json()["id"]

    res2_token = client.post("/api/auth/login", json={"email": "testresident2@society.com", "password": "residentpass123"}).json()["access_token"]
    res2_headers = {"Authorization": f"Bearer {res2_token}"}

    # Resident 2 tries to GET Resident 1's complaint -> 403 Forbidden
    detail_res = client.get(f"/api/complaints/{cid}", headers=res2_headers)
    assert detail_res.status_code == 403

    # Resident 2 tries to GET Resident 1's history -> 403 Forbidden
    history_res = client.get(f"/api/complaints/{cid}/history", headers=res2_headers)
    assert history_res.status_code == 403

    # Resident 2 lists complaints -> only sees own (0 items)
    list_res = client.get("/api/complaints", headers=res2_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0

# 5. Admin can access all complaints & history
def test_admin_can_access_all_complaints():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    create_res = client.post(
        "/api/complaints",
        data={"title": "Plumbing Leak", "category": "Plumbing", "description": "Leak under sink"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    cid = create_res.json()["id"]

    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin GET complaint detail
    detail_res = client.get(f"/api/complaints/{cid}", headers=admin_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == cid

    # Admin GET complaint history
    hist_res = client.get(f"/api/complaints/{cid}/history", headers=admin_headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1
    assert hist_res.json()[0]["action_type"] == "CREATED"

# 6. Status & Priority Lifecycle with Immutable History & Action Types
def test_status_and_priority_lifecycle():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    cid = client.post(
        "/api/complaints",
        data={"title": "Lift issue", "category": "Elevator", "description": "Door sticking"},
        headers={"Authorization": f"Bearer {res1_token}"}
    ).json()["id"]

    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Change Priority
    pri_res = client.patch(
        f"/api/complaints/{cid}/priority",
        json={"priority": "High", "note": "High traffic elevator"},
        headers=admin_headers
    )
    assert pri_res.status_code == 200
    assert pri_res.json()["priority"] == "High"

    # Change Status to In Progress
    prog_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "In Progress", "note": "Technician dispatched"},
        headers=admin_headers
    )
    assert prog_res.status_code == 200
    assert prog_res.json()["status"] == "In Progress"

    # Change Status to Resolved
    res_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "Resolved", "note": "Replaced roller bearing"},
        headers=admin_headers
    )
    assert res_res.status_code == 200
    resolved_data = res_res.json()
    assert resolved_data["status"] == "Resolved"
    assert resolved_data["resolved_at"] is not None
    assert resolved_data["is_overdue"] is False

    # Check complete history
    history = client.get(f"/api/complaints/{cid}/history", headers=admin_headers).json()
    assert len(history) == 4
    action_types = [h["action_type"] for h in history]
    assert "CREATED" in action_types
    assert "PRIORITY_CHANGED" in action_types
    assert "STATUS_CHANGED" in action_types

# 7. Category-Specific SLA & Overdue Recalculation
def test_category_specific_sla_overdue():
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    db = TestingSessionLocal()
    res_user = db.query(User).filter(User.email == "testresident1@society.com").first()

    # Elevator SLA is 1 day. Create elevator complaint 2 days old -> should be marked overdue
    c_lift = Complaint(
        resident_id=res_user.id,
        title="Elevator light broken",
        category="Elevator",
        description="Dark inside lift",
        status=ComplaintStatus.OPEN.value,
        priority=ComplaintPriority.MEDIUM.value,
        is_overdue=False,
        created_at=datetime.utcnow() - timedelta(days=2),
        updated_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(c_lift)
    db.commit()
    db.close()

    # Query complaints as admin -> should trigger overdue update based on 1-day elevator SLA
    admin_list = client.get("/api/complaints?is_overdue=true", headers=admin_headers).json()
    assert len(admin_list) >= 1
    assert any(c["title"] == "Elevator light broken" and c["is_overdue"] is True for c in admin_list)

# 8. Staff Role, Assignment & Staff Queue
def test_staff_role_and_assignment():
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]

    # Resident creates plumbing complaint
    c_res = client.post(
        "/api/complaints",
        data={"title": "Sink clogged", "category": "Plumbing", "description": "Need plumber"},
        headers={"Authorization": f"Bearer {res_token}"}
    )
    cid = c_res.json()["id"]

    # Get staff list
    staff_list = client.get("/api/admin/staff", headers=admin_headers).json()
    assert len(staff_list) >= 1
    staff_id = staff_list[0]["id"]

    # Admin assigns staff to complaint
    assign_res = client.patch(
        f"/api/admin/complaints/{cid}/assign",
        json={"staff_id": staff_id, "note": "Assigned to primary plumber"},
        headers=admin_headers
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_to"] == staff_id

    # Staff logs in
    staff_token = client.post("/api/auth/login", json={"email": "teststaff@society.com", "password": "staffpass123"}).json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Staff checks their assigned queue
    staff_queue = client.get("/api/staff/complaints", headers=staff_headers).json()
    assert any(item["id"] == cid for item in staff_queue)

    # Staff updates status to In Progress
    staff_update = client.patch(
        f"/api/staff/complaints/{cid}/status",
        json={"status": "In Progress", "note": "Plumber arrived on site with drain snake"},
        headers=staff_headers
    )
    assert staff_update.status_code == 200
    assert staff_update.json()["status"] == "In Progress"

    # Staff cannot access administrative settings (RBAC 403 test)
    admin_only_res = client.get("/api/admin/audit-logs", headers=staff_headers)
    assert admin_only_res.status_code == 403

# 9. Complaint Discussion Comments
def test_complaint_comments():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]

    cid = client.post(
        "/api/complaints",
        data={"title": "Geyser issue", "category": "Electrical", "description": "No hot water"},
        headers={"Authorization": f"Bearer {res1_token}"}
    ).json()["id"]

    # Resident adds comment
    c1 = client.post(
        f"/api/complaints/{cid}/comments",
        json={"message": "Please come between 5 PM and 7 PM"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    assert c1.status_code == 201
    assert c1.json()["author_name"] == "Resident One"

    # Admin adds comment
    c2 = client.post(
        f"/api/complaints/{cid}/comments",
        json={"message": "Noted, technician scheduled for 5:30 PM"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert c2.status_code == 201

    # Fetch comments thread
    comments = client.get(f"/api/complaints/{cid}/comments", headers={"Authorization": f"Bearer {res1_token}"}).json()
    assert len(comments) == 2

# 10. Resident Satisfaction Feedback (Resolved-only, duplicate prevention)
def test_resident_satisfaction_feedback():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]

    cid = client.post(
        "/api/complaints",
        data={"title": "Switch broken", "category": "Electrical", "description": "Living room switch"},
        headers={"Authorization": f"Bearer {res1_token}"}
    ).json()["id"]

    # Trying to submit feedback when Open -> 400 Bad Request
    fb_early = client.post(
        f"/api/complaints/{cid}/feedback",
        json={"rating": 5, "comment": "Great"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    assert fb_early.status_code == 400

    # Resolve complaint
    client.patch(f"/api/complaints/{cid}/status", json={"status": "Resolved"}, headers={"Authorization": f"Bearer {admin_token}"})

    # Submit feedback
    fb_res = client.post(
        f"/api/complaints/{cid}/feedback",
        json={"rating": 5, "comment": "Fixed rapidly! Thanks!"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    assert fb_res.status_code == 201
    assert fb_res.json()["rating"] == 5

    # Submitting duplicate feedback -> 400 Bad Request
    fb_dup = client.post(
        f"/api/complaints/{cid}/feedback",
        json={"rating": 4, "comment": "Changed my mind"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    assert fb_dup.status_code == 400

# 11. Reopen Request Flow
def test_reopen_request_flow():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]

    cid = client.post(
        "/api/complaints",
        data={"title": "Seepage issue", "category": "Civil", "description": "Ceiling seepage"},
        headers={"Authorization": f"Bearer {res1_token}"}
    ).json()["id"]

    client.patch(f"/api/complaints/{cid}/status", json={"status": "Resolved"}, headers={"Authorization": f"Bearer {admin_token}"})

    # Resident submits reopen request
    reopen_res = client.post(
        f"/api/complaints/{cid}/reopen-request",
        json={"reason": "Water started leaking again after rain"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )
    assert reopen_res.status_code == 201
    req_id = reopen_res.json()["id"]
    assert reopen_res.json()["status"] == "Pending"

    # Admin reviews and approves
    review_res = client.patch(
        f"/api/admin/reopen-requests/{req_id}/review",
        json={"decision": "Approved", "admin_notes": "Sending senior engineer"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "Approved"

    # Complaint is now In Progress
    c_check = client.get(f"/api/complaints/{cid}", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert c_check["status"] == "In Progress"

# 12. Duplicate Complaint Detection
def test_duplicate_complaint_detection():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {res1_token}"}

    client.post(
        "/api/complaints",
        data={"title": "Water leakage in Block B ceiling", "category": "Plumbing", "description": "Water leaking from ceiling continuously"},
        headers=headers
    )

    dup_check = client.post(
        "/api/complaints/check-duplicate",
        json={"title": "Water leaking in Block B ceiling", "category": "Plumbing", "description": "Heavy leak from ceiling"},
        headers=headers
    )
    assert dup_check.status_code == 200
    res_data = dup_check.json()
    assert res_data["has_potential_duplicates"] is True
    assert len(res_data["potential_duplicates"]) >= 1

# 13. In-App Notifications
def test_in_app_notifications():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]

    # Admin posts important notice -> generates in-app notifications
    client.post(
        "/api/notices",
        json={"title": "Emergency Generator Test", "content": "Power cut for 15 mins", "is_important": True},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Resident gets notifications
    notifs = client.get("/api/notifications", headers={"Authorization": f"Bearer {res1_token}"}).json()
    assert len(notifs) >= 1

    unread = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {res1_token}"}).json()
    assert unread["unread_count"] >= 1

    # Mark all read
    client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {res1_token}"})
    unread_after = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {res1_token}"}).json()
    assert unread_after["unread_count"] == 0

# 14. Admin Search & CSV Export
def test_admin_search_and_csv_export():
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]

    client.post(
        "/api/complaints",
        data={"title": "Fire extinguisher expired", "category": "Security", "description": "Need new cylinder"},
        headers={"Authorization": f"Bearer {res1_token}"}
    )

    # Search by text
    search_res = client.get("/api/admin/complaints?search=extinguisher", headers={"Authorization": f"Bearer {admin_token}"})
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # CSV Export
    csv_res = client.get("/api/admin/reports/complaints/csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Complaint ID" in csv_res.text
    assert "Fire extinguisher expired" in csv_res.text

# 15. Dashboard Smart Analytics
def test_dashboard_smart_analytics():
    admin_token = client.post("/api/auth/login", json={"email": "testadmin@society.com", "password": "adminpass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    summary = client.get("/api/admin/dashboard/summary", headers=headers).json()
    assert "avg_resolution_hours" in summary
    assert "resolution_rate" in summary
    assert "overdue_percentage" in summary

    stats = client.get("/api/dashboard/stats", headers=headers).json()
    assert "staff_workloads" in stats
    assert "rating_distribution" in stats
    assert "sla_compliance_rate" in stats

# 16. Profile Update & Password Change
def test_update_profile_and_password():
    res1_token = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "residentpass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {res1_token}"}

    # Update personal details
    update_res = client.put(
        "/api/auth/profile",
        json={"full_name": "Resident Updated", "phone_number": "+91 99999 88888", "flat_number": "C-303"},
        headers=headers
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["full_name"] == "Resident Updated"
    assert updated_data["phone_number"] == "+91 99999 88888"
    assert updated_data["flat_number"] == "C-303"

    # Try changing password with wrong current password -> 400
    wrong_pw_res = client.put(
        "/api/auth/profile",
        json={"current_password": "wrongpassword", "new_password": "newpassword123"},
        headers=headers
    )
    assert wrong_pw_res.status_code == 400

    # Change password successfully
    pw_res = client.put(
        "/api/auth/profile",
        json={"current_password": "residentpass123", "new_password": "newpassword123"},
        headers=headers
    )
    assert pw_res.status_code == 200

    # Verify login with new password
    new_login = client.post("/api/auth/login", json={"email": "testresident1@society.com", "password": "newpassword123"})
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
