from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.complaint import (
    Complaint,
    ComplaintHistory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategory,
    ComplaintCategoryModel,
    ComplaintComment,
    ComplaintFeedback,
    ReopenRequest,
    ComplaintAttachment,
    ActionType,
)
from app.models.notice import Notice
from app.models.setting import Setting
from app.models.notification import Notification, NotificationType
from app.models.audit_log import AdminAuditLog
from app.services.auth_service import get_password_hash
from app.config import settings

def seed_database(db: Session):
    """Seed demo accounts, category SLAs, sample complaints, and interactive test data."""
    # 1. Admin account
    admin_user = db.query(User).filter(User.email == "admin@society.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@society.com",
            full_name="Society Admin (President)",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN.value,
            flat_number="Management Office",
            phone_number="+91 98765 43210",
            is_active=True
        )
        db.add(admin_user)
        db.flush()

    # 2. Resident accounts
    resident_user = db.query(User).filter(User.email == "resident@society.com").first()
    if not resident_user:
        resident_user = User(
            email="resident@society.com",
            full_name="Rahul Sharma",
            password_hash=get_password_hash("resident123"),
            role=UserRole.RESIDENT.value,
            flat_number="A-402, Tower 1",
            phone_number="+91 98765 12345",
            is_active=True
        )
        db.add(resident_user)
        db.flush()

    resident_user_2 = db.query(User).filter(User.email == "priya@society.com").first()
    if not resident_user_2:
        resident_user_2 = User(
            email="priya@society.com",
            full_name="Priya Patel",
            password_hash=get_password_hash("resident123"),
            role=UserRole.RESIDENT.value,
            flat_number="B-701, Tower 2",
            phone_number="+91 98765 67890",
            is_active=True
        )
        db.add(resident_user_2)
        db.flush()

    # 3. Staff accounts
    staff_plumber = db.query(User).filter(User.email == "plumber@society.com").first()
    if not staff_plumber:
        staff_plumber = User(
            email="plumber@society.com",
            full_name="Ramesh Kumar (Plumber)",
            password_hash=get_password_hash("staff123"),
            role=UserRole.STAFF.value,
            specialization="Plumbing",
            phone_number="+91 91234 56780",
            is_active=True
        )
        db.add(staff_plumber)
        db.flush()

    staff_electrician = db.query(User).filter(User.email == "electrician@society.com").first()
    if not staff_electrician:
        staff_electrician = User(
            email="electrician@society.com",
            full_name="Suresh Verma (Electrician)",
            password_hash=get_password_hash("staff123"),
            role=UserRole.STAFF.value,
            specialization="Electrical",
            phone_number="+91 91234 56781",
            is_active=True
        )
        db.add(staff_electrician)
        db.flush()

    staff_cleaner = db.query(User).filter(User.email == "cleaner@society.com").first()
    if not staff_cleaner:
        staff_cleaner = User(
            email="cleaner@society.com",
            full_name="Sunil Yadav (Sanitation)",
            password_hash=get_password_hash("staff123"),
            role=UserRole.STAFF.value,
            specialization="Cleaning & Sanitation",
            phone_number="+91 91234 56782",
            is_active=True
        )
        db.add(staff_cleaner)
        db.flush()

    # 4. Seed Category SLAs
    category_slas = [
        ("Plumbing", 2),
        ("Electrical", 2),
        ("Civil", 4),
        ("Pest Control", 3),
        ("Elevator", 1),
        ("Cleaning & Sanitation", 1),
        ("Security", 1),
        ("Carpentry", 3),
        ("Other", 7),
    ]
    for cat_name, sla in category_slas:
        cat_rec = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.name == cat_name).first()
        if not cat_rec:
            db.add(ComplaintCategoryModel(name=cat_name, sla_days=sla, is_active=True))

    # 5. Overdue threshold setting
    threshold_setting = db.query(Setting).filter(Setting.key == "overdue_threshold_days").first()
    if not threshold_setting:
        threshold_setting = Setting(
            key="overdue_threshold_days",
            value=str(settings.DEFAULT_OVERDUE_DAYS),
            description="Global number of days after which an unresolved complaint is marked overdue"
        )
        db.add(threshold_setting)

    # 6. Notices
    if db.query(Notice).count() == 0:
        n1 = Notice(
            author_id=admin_user.id,
            title="Scheduled Water Tank Cleaning & Supply Interruption",
            content="Please note that overhead water tank cleaning for all towers is scheduled for this coming Saturday between 10:00 AM and 4:00 PM. Water supply will be suspended during these hours. Please store sufficient water in advance.",
            is_important=True,
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        n2 = Notice(
            author_id=admin_user.id,
            title="Annual General Body Meeting (AGM) 2026",
            content="The Annual General Body Meeting will be held on the first Sunday of next month in the Clubhouse Hall. All flat owners and tenants are cordially invited to attend and discuss community maintenance, security enhancements, and EV charging stations.",
            is_important=False,
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        n3 = Notice(
            author_id=admin_user.id,
            title="Elevator Maintenance Schedule for Tower 2",
            content="Lift #2 in Tower B will undergo preventive maintenance on Thursday between 2:00 PM and 5:00 PM. Lift #1 will remain fully operational.",
            is_important=False,
            created_at=datetime.utcnow() - timedelta(days=5)
        )
        db.add_all([n1, n2, n3])

    # 7. Sample Complaints
    if db.query(Complaint).count() == 0:
        # 1. Overdue Open Complaint (Plumbing) assigned to Ramesh
        c1 = Complaint(
            resident_id=resident_user.id,
            title="Severe pipe leakage under kitchen sink",
            category=ComplaintCategory.PLUMBING.value,
            description="There is continuous water seepage under the kitchen sink leaking into the cabinet and wooden flooring. Need plumber urgently.",
            status=ComplaintStatus.OPEN.value,
            priority=ComplaintPriority.HIGH.value,
            is_overdue=True,
            assigned_to=staff_plumber.id,
            assigned_at=datetime.utcnow() - timedelta(days=8),
            created_at=datetime.utcnow() - timedelta(days=9),
            updated_at=datetime.utcnow() - timedelta(days=8)
        )
        db.add(c1)
        db.flush()
        db.add(ComplaintHistory(
            complaint_id=c1.id,
            actor_id=resident_user.id,
            actor_name=resident_user.full_name,
            actor_role=resident_user.role,
            action_type=ActionType.CREATED.value,
            new_status=ComplaintStatus.OPEN.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Complaint raised by resident.",
            created_at=c1.created_at
        ))
        db.add(ComplaintHistory(
            complaint_id=c1.id,
            actor_id=admin_user.id,
            actor_name=admin_user.full_name,
            actor_role=admin_user.role,
            action_type=ActionType.ASSIGNED.value,
            old_status=ComplaintStatus.OPEN.value,
            new_status=ComplaintStatus.OPEN.value,
            old_priority=ComplaintPriority.HIGH.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Assigned to Ramesh Kumar (Plumber)",
            created_at=c1.assigned_at
        ))
        db.add(ComplaintComment(
            complaint_id=c1.id,
            author_id=staff_plumber.id,
            author_name=staff_plumber.full_name,
            author_role=staff_plumber.role,
            message="I visited the flat at 11 AM; main valve needs washer replacement. Procuring spare part from market.",
            created_at=datetime.utcnow() - timedelta(days=7)
        ))

        # 2. In Progress Complaint (Electrical) assigned to Suresh
        c2 = Complaint(
            resident_id=resident_user.id,
            title="Corridor light flickering and short circuit sound",
            category=ComplaintCategory.ELECTRICAL.value,
            description="The 4th floor corridor main light keeps sparking and buzzing when switched on. Potential fire hazard.",
            status=ComplaintStatus.IN_PROGRESS.value,
            priority=ComplaintPriority.HIGH.value,
            is_overdue=False,
            assigned_to=staff_electrician.id,
            assigned_at=datetime.utcnow() - timedelta(days=2),
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(hours=6)
        )
        db.add(c2)
        db.flush()
        db.add(ComplaintHistory(
            complaint_id=c2.id,
            actor_id=resident_user.id,
            actor_name=resident_user.full_name,
            actor_role=resident_user.role,
            action_type=ActionType.CREATED.value,
            new_status=ComplaintStatus.OPEN.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Complaint registered.",
            created_at=c2.created_at
        ))
        db.add(ComplaintHistory(
            complaint_id=c2.id,
            actor_id=admin_user.id,
            actor_name=admin_user.full_name,
            actor_role=admin_user.role,
            action_type=ActionType.STATUS_CHANGED.value,
            old_status=ComplaintStatus.OPEN.value,
            new_status=ComplaintStatus.IN_PROGRESS.value,
            old_priority=ComplaintPriority.HIGH.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Assigned to Suresh Verma. Replacing ballast tomorrow morning.",
            created_at=c2.updated_at
        ))
        db.add(ComplaintComment(
            complaint_id=c2.id,
            author_id=resident_user.id,
            author_name=resident_user.full_name,
            author_role=resident_user.role,
            message="Thanks Suresh, please let me know when power will be turned off temporarily.",
            created_at=datetime.utcnow() - timedelta(hours=4)
        ))

        # 3. Resolved Complaint (Elevator) with 5-star resident feedback
        c3 = Complaint(
            resident_id=resident_user_2.id,
            title="Elevator floor sensor misalignment on 7th floor",
            category=ComplaintCategory.ELEVATOR.value,
            description="The elevator stops approximately 2 inches below the floor level on floor 7, causing tripping hazard.",
            status=ComplaintStatus.RESOLVED.value,
            priority=ComplaintPriority.HIGH.value,
            is_overdue=False,
            created_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(days=2),
            resolved_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(c3)
        db.flush()
        db.add(ComplaintHistory(
            complaint_id=c3.id,
            actor_id=resident_user_2.id,
            actor_name=resident_user_2.full_name,
            actor_role=resident_user_2.role,
            action_type=ActionType.CREATED.value,
            new_status=ComplaintStatus.OPEN.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Complaint raised.",
            created_at=c3.created_at
        ))
        db.add(ComplaintHistory(
            complaint_id=c3.id,
            actor_id=admin_user.id,
            actor_name=admin_user.full_name,
            actor_role=admin_user.role,
            action_type=ActionType.STATUS_CHANGED.value,
            old_status=ComplaintStatus.OPEN.value,
            new_status=ComplaintStatus.RESOLVED.value,
            old_priority=ComplaintPriority.HIGH.value,
            new_priority=ComplaintPriority.HIGH.value,
            note="Floor alignment sensor recalibrated and tested. Operating smoothly.",
            created_at=c3.resolved_at
        ))
        # Add feedback
        db.add(ComplaintFeedback(
            complaint_id=c3.id,
            resident_id=resident_user_2.id,
            rating=5,
            comment="Prompt resolution! Lift is perfectly level now. Very safe.",
            created_at=datetime.utcnow() - timedelta(days=1)
        ))

        # 4. Open Complaint (Pest Control)
        c4 = Complaint(
            resident_id=resident_user_2.id,
            title="Termite infestation in utility duct",
            category=ComplaintCategory.PEST_CONTROL.value,
            description="Noticed termite mud tubes along the common utility duct wall near the balcony.",
            status=ComplaintStatus.OPEN.value,
            priority=ComplaintPriority.MEDIUM.value,
            is_overdue=False,
            created_at=datetime.utcnow() - timedelta(hours=18),
            updated_at=datetime.utcnow() - timedelta(hours=18)
        )
        db.add(c4)
        db.flush()
        db.add(ComplaintHistory(
            complaint_id=c4.id,
            actor_id=resident_user_2.id,
            actor_name=resident_user_2.full_name,
            actor_role=resident_user_2.role,
            action_type=ActionType.CREATED.value,
            new_status=ComplaintStatus.OPEN.value,
            new_priority=ComplaintPriority.MEDIUM.value,
            note="Complaint raised by resident.",
            created_at=c4.created_at
        ))

        # Sample initial notifications
        db.add(Notification(
            user_id=resident_user.id,
            title="Welcome to Homely",
            message="Your Homely resident account is active. You can raise and track complaints anytime.",
            type=NotificationType.STATUS_UPDATE.value,
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=9)
        ))
        db.add(Notification(
            user_id=resident_user.id,
            title="Complaint #2 Status: In Progress",
            message="Suresh Verma has been assigned to your corridor lighting ticket.",
            type=NotificationType.STATUS_UPDATE.value,
            related_complaint_id=c2.id,
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=6)
        ))

        # Sample admin audit log entry
        db.add(AdminAuditLog(
            admin_id=admin_user.id,
            admin_name=admin_user.full_name,
            action="SYSTEM_INIT",
            target_entity="system",
            details="Seeded default demo users, categories, SLAs, and initial tickets.",
            created_at=datetime.utcnow()
        ))

    db.commit()
