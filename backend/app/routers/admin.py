from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintCategoryModel, ReopenRequest
from app.models.audit_log import AdminAuditLog
from app.schemas.auth import UserResponse, StaffCreate, StaffUpdate
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintStatusUpdate,
    ComplaintPriorityUpdate,
    ComplaintAssignRequest,
    CategorySlaCreate,
    CategorySlaUpdate,
    CategorySlaResponse,
    ReopenRequestResponse,
    ReopenRequestReview,
    RecurringIssueItem,
)
from app.schemas.audit_log import AdminAuditLogResponse
from app.schemas.dashboard import DashboardSummary, DashboardStats
from app.services.complaint_service import (
    update_complaint_status,
    update_complaint_priority,
    assign_staff_to_complaint,
    get_filtered_complaints,
    review_reopen_request,
    detect_recurring_issues,
    generate_complaints_csv,
)
from app.services.auth_service import get_password_hash
from app.services.overdue_service import update_overdue_status
from app.services.audit_service import log_admin_action
from app.routers.dashboard import get_dashboard_summary as fetch_summary, get_dashboard_stats as fetch_stats
from app.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/complaints", response_model=List[ComplaintResponse])
def admin_list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    resident_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint to query, search, and filter all complaints across the society."""
    return get_filtered_complaints(
        db=db,
        resident_id=resident_id,
        assigned_to=assigned_to,
        category=category,
        status_filter=status,
        priority=priority,
        is_overdue=is_overdue,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by_overdue_first=True
    )

@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintDetailResponse)
def admin_change_complaint_status(
    complaint_id: int,
    status_in: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update complaint status and log audit history."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    res = update_complaint_status(
        db=db,
        complaint=complaint,
        actor=admin_user,
        new_status=status_in.status,
        note=status_in.note
    )
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="STATUS_CHANGED",
        target_entity="complaint",
        target_id=str(complaint.id),
        details=f"Status changed to {status_in.status}"
    )
    return res

@router.patch("/complaints/{complaint_id}/priority", response_model=ComplaintDetailResponse)
def admin_change_complaint_priority(
    complaint_id: int,
    priority_in: ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update complaint priority and log audit history."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    res = update_complaint_priority(
        db=db,
        complaint=complaint,
        actor=admin_user,
        new_priority=priority_in.priority,
        note=priority_in.note
    )
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="PRIORITY_CHANGED",
        target_entity="complaint",
        target_id=str(complaint.id),
        details=f"Priority changed to {priority_in.priority}"
    )
    return res

@router.patch("/complaints/{complaint_id}/assign", response_model=ComplaintDetailResponse)
def admin_assign_complaint(
    complaint_id: int,
    assign_in: ComplaintAssignRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Assign complaint to maintenance staff member."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    res = assign_staff_to_complaint(
        db=db,
        complaint=complaint,
        actor=admin_user,
        staff_id=assign_in.staff_id,
        note=assign_in.note
    )
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="STAFF_ASSIGNED",
        target_entity="complaint",
        target_id=str(complaint.id),
        details=f"Assigned to staff id {assign_in.staff_id}"
    )
    return res

# ----------------- Staff Management -----------------

@router.get("/staff", response_model=List[UserResponse])
def admin_list_staff(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: List all maintenance staff members."""
    return db.query(User).filter(User.role == UserRole.STAFF.value).all()

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_staff(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Create a new maintenance staff user."""
    existing = db.query(User).filter(User.email == staff_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    staff = User(
        email=staff_in.email.lower().strip(),
        full_name=staff_in.full_name.strip(),
        password_hash=get_password_hash(staff_in.password),
        role=UserRole.STAFF.value,
        phone_number=staff_in.phone_number.strip() if staff_in.phone_number else None,
        specialization=staff_in.specialization.strip(),
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="USER_CREATED",
        target_entity="user",
        target_id=str(staff.id),
        details=f"Created staff account {staff.full_name} ({staff.specialization})"
    )
    return staff

@router.patch("/staff/{staff_id}", response_model=UserResponse)
def admin_update_staff(
    staff_id: int,
    update_in: StaffUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update staff details or activate/deactivate account."""
    staff = db.query(User).filter(User.id == staff_id, User.role == UserRole.STAFF.value).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if update_in.full_name is not None:
        staff.full_name = update_in.full_name.strip()
    if update_in.phone_number is not None:
        staff.phone_number = update_in.phone_number.strip()
    if update_in.specialization is not None:
        staff.specialization = update_in.specialization.strip()
    if update_in.is_active is not None:
        staff.is_active = update_in.is_active

    db.commit()
    db.refresh(staff)

    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="USER_UPDATED",
        target_entity="user",
        target_id=str(staff.id),
        details=f"Updated staff {staff.full_name} status: active={staff.is_active}"
    )
    return staff

# ----------------- Category SLA Management -----------------

@router.get("/categories", response_model=List[CategorySlaResponse])
def admin_list_category_slas(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: List all complaint category SLA configurations."""
    return db.query(ComplaintCategoryModel).order_by(ComplaintCategoryModel.name).all()

@router.post("/categories", response_model=CategorySlaResponse, status_code=status.HTTP_201_CREATED)
def admin_create_category_sla(
    cat_in: CategorySlaCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Create a new category with specific SLA days."""
    existing = db.query(ComplaintCategoryModel).filter(
        ComplaintCategoryModel.name.ilike(cat_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists.")

    cat = ComplaintCategoryModel(
        name=cat_in.name.strip(),
        sla_days=cat_in.sla_days,
        is_active=cat_in.is_active if cat_in.is_active is not None else True
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    update_overdue_status(db)
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="CATEGORY_CREATED",
        target_entity="category",
        target_id=str(cat.id),
        details=f"Created category {cat.name} with {cat.sla_days} days SLA"
    )
    return cat

@router.put("/categories/{cat_id}", response_model=CategorySlaResponse)
def admin_update_category_sla(
    cat_id: int,
    cat_in: CategorySlaUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update category SLA days and re-evaluate overdue status."""
    cat = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    if cat_in.sla_days is not None:
        cat.sla_days = cat_in.sla_days
    if cat_in.is_active is not None:
        cat.is_active = cat_in.is_active

    db.commit()
    db.refresh(cat)

    update_overdue_status(db)
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="SLA_UPDATED",
        target_entity="category",
        target_id=str(cat.id),
        details=f"Updated category {cat.name} SLA to {cat.sla_days} days"
    )
    return cat

# ----------------- Reopen Requests Review -----------------

@router.get("/reopen-requests", response_model=List[ReopenRequestResponse])
def admin_list_reopen_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: List reopen requests submitted by residents."""
    query = db.query(ReopenRequest)
    if status:
        query = query.filter(ReopenRequest.status == status)
    return query.order_by(desc(ReopenRequest.created_at)).all()

@router.patch("/reopen-requests/{request_id}/review", response_model=ReopenRequestResponse)
def admin_review_reopen_request(
    request_id: int,
    review_in: ReopenRequestReview,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Approve or reject a reopen request."""
    reopen_req = db.query(ReopenRequest).filter(ReopenRequest.id == request_id).first()
    if not reopen_req:
        raise HTTPException(status_code=404, detail="Reopen request not found.")

    res = review_reopen_request(
        db=db,
        reopen_req=reopen_req,
        admin=admin_user,
        decision=review_in.decision,
        admin_notes=review_in.admin_notes
    )
    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action=f"REOPEN_{review_in.decision.upper()}",
        target_entity="complaint",
        target_id=str(reopen_req.complaint_id),
        details=f"Reopen request {review_in.decision}: {review_in.admin_notes or ''}"
    )
    return res

# ----------------- Audit Logs & Analytics -----------------

@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def admin_get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Fetch recent administrative audit logs."""
    return db.query(AdminAuditLog).order_by(desc(AdminAuditLog.created_at)).limit(limit).all()

@router.get("/analytics/recurring-issues", response_model=List[RecurringIssueItem])
def admin_get_recurring_issues(
    days: int = 30,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Identify recurring maintenance issues by location and category."""
    return detect_recurring_issues(db=db, days=days)

@router.get("/reports/complaints/csv")
def admin_export_complaints_csv(
    status: Optional[str] = None,
    category: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Export filtered complaint records as CSV report."""
    complaints = get_filtered_complaints(
        db=db,
        category=category,
        status_filter=status,
        is_overdue=is_overdue,
        date_from=date_from,
        date_to=date_to,
        sort_by_overdue_first=True
    )
    csv_content = generate_complaints_csv(complaints)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=complaints_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/dashboard/summary", response_model=DashboardSummary)
def admin_get_dashboard_summary(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Get key summary metrics."""
    return fetch_summary(db=db, admin_user=admin_user)

@router.get("/dashboard/stats", response_model=DashboardStats)
def admin_get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Get complete dashboard analytics."""
    return fetch_stats(db=db, admin_user=admin_user)
