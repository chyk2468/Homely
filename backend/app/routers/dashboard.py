from collections import Counter
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import (
    Complaint,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategory,
    ComplaintCategoryModel,
    ComplaintFeedback,
)
from app.schemas.dashboard import DashboardStats, DashboardSummary, StaffWorkloadItem
from app.services.overdue_service import update_overdue_status, get_overdue_threshold_days, enrich_complaint_sla
from app.services.complaint_service import detect_recurring_issues
from app.dependencies import require_admin

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Dedicated dashboard summary reporting endpoint:
    - Total, Open, In Progress, Resolved, Overdue
    - Average resolution time, resolution rate, overdue percentage, resident satisfaction
    """
    threshold_days = get_overdue_threshold_days(db)
    update_overdue_status(db, threshold_days)

    all_complaints = db.query(Complaint).all()
    
    total = len(all_complaints)
    open_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.OPEN.value)
    in_progress_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.IN_PROGRESS.value)
    resolved_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.RESOLVED.value)
    overdue_count = sum(1 for c in all_complaints if c.is_overdue)

    # Categories
    category_counter = Counter(c.category for c in all_complaints)
    db_cats = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.is_active == True).all()
    category_names = [c.name for c in db_cats] if db_cats else [c.value for c in ComplaintCategory]
    category_counts = {cat: category_counter.get(cat, 0) for cat in category_names}
    for cat_name, count in category_counter.items():
        category_counts[cat_name] = count

    status_counts = {
        ComplaintStatus.OPEN.value: open_count,
        ComplaintStatus.IN_PROGRESS.value: in_progress_count,
        ComplaintStatus.RESOLVED.value: resolved_count
    }

    # Resolution rate and overdue rate
    resolution_rate = round((resolved_count / total * 100), 1) if total > 0 else 0.0
    overdue_percentage = round((overdue_count / total * 100), 1) if total > 0 else 0.0

    # Average resolution time in hours
    resolved_complaints = [c for c in all_complaints if c.status == ComplaintStatus.RESOLVED.value and c.resolved_at and c.created_at]
    if resolved_complaints:
        total_resolution_seconds = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_complaints)
        avg_res_hours = round(total_resolution_seconds / (len(resolved_complaints) * 3600), 1)
    else:
        avg_res_hours = 0.0

    # Resident satisfaction
    feedbacks = db.query(ComplaintFeedback).all()
    total_feedbacks = len(feedbacks)
    avg_satisfaction = round(sum(f.rating for f in feedbacks) / total_feedbacks, 1) if total_feedbacks > 0 else 0.0

    return DashboardSummary(
        total_complaints=total,
        open_complaints=open_count,
        in_progress_complaints=in_progress_count,
        resolved_complaints=resolved_count,
        overdue_complaints=overdue_count,
        status_counts=status_counts,
        category_counts=category_counts,
        overdue_threshold_days=threshold_days,
        avg_resolution_hours=avg_res_hours,
        resolution_rate=resolution_rate,
        overdue_percentage=overdue_percentage,
        avg_satisfaction_rating=avg_satisfaction,
        total_feedbacks=total_feedbacks
    )

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Admin dashboard metrics:
    - Total complaints by status, category, priority
    - Overdue complaint count and overdue list
    - Staff workloads, SLA compliance, satisfaction ratings, recurring issues
    """
    threshold_days = get_overdue_threshold_days(db)
    update_overdue_status(db, threshold_days)

    all_complaints = db.query(Complaint).all()
    
    total = len(all_complaints)
    open_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.OPEN.value)
    in_progress_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.IN_PROGRESS.value)
    resolved_count = sum(1 for c in all_complaints if c.status == ComplaintStatus.RESOLVED.value)
    overdue_count = sum(1 for c in all_complaints if c.is_overdue)

    # Category counts
    category_counter = Counter(c.category for c in all_complaints)
    db_cats = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.is_active == True).all()
    category_names = [c.name for c in db_cats] if db_cats else [c.value for c in ComplaintCategory]
    category_counts = {cat: category_counter.get(cat, 0) for cat in category_names}
    for cat_name, count in category_counter.items():
        category_counts[cat_name] = count

    # Priority counts
    priority_counter = Counter(c.priority for c in all_complaints)
    priority_counts = {p.value: priority_counter.get(p.value, 0) for p in ComplaintPriority}

    # Status counts dictionary
    status_counts = {
        ComplaintStatus.OPEN.value: open_count,
        ComplaintStatus.IN_PROGRESS.value: in_progress_count,
        ComplaintStatus.RESOLVED.value: resolved_count
    }

    # Resolution rate and overdue rate
    resolution_rate = round((resolved_count / total * 100), 1) if total > 0 else 0.0
    overdue_percentage = round((overdue_count / total * 100), 1) if total > 0 else 0.0

    # Average resolution hours
    resolved_complaints = [c for c in all_complaints if c.status == ComplaintStatus.RESOLVED.value and c.resolved_at and c.created_at]
    if resolved_complaints:
        total_res_sec = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_complaints)
        avg_res_hours = round(total_res_sec / (len(resolved_complaints) * 3600), 1)
    else:
        avg_res_hours = 0.0

    # SLA compliance rate = percentage of resolved tickets resolved before deadline + open tickets not yet overdue
    on_track_count = total - overdue_count
    sla_compliance_rate = round((on_track_count / total * 100), 1) if total > 0 else 100.0

    # Overdue list
    overdue_list = [c for c in all_complaints if c.is_overdue]
    overdue_list.sort(key=lambda x: x.created_at)
    for c in overdue_list:
        enrich_complaint_sla(c, db, threshold_days)

    # Recent complaints
    recent_complaints = db.query(Complaint).order_by(desc(Complaint.created_at)).limit(8).all()
    for c in recent_complaints:
        enrich_complaint_sla(c, db, threshold_days)

    # Staff workloads
    staff_users = db.query(User).filter(User.role == UserRole.STAFF.value).all()
    staff_workloads = []
    for staff in staff_users:
        active = sum(1 for c in all_complaints if c.assigned_to == staff.id and c.status != ComplaintStatus.RESOLVED.value)
        res = sum(1 for c in all_complaints if c.assigned_to == staff.id and c.status == ComplaintStatus.RESOLVED.value)
        staff_workloads.append(StaffWorkloadItem(
            staff_id=staff.id,
            staff_name=staff.full_name,
            specialization=staff.specialization,
            active_tickets=active,
            resolved_tickets=res
        ))

    # Resident satisfaction distribution & average
    feedbacks = db.query(ComplaintFeedback).all()
    rating_counter = Counter(f.rating for f in feedbacks)
    rating_distribution = {f"{star} Stars": rating_counter.get(star, 0) for star in range(1, 6)}
    avg_satisfaction = round(sum(f.rating for f in feedbacks) / len(feedbacks), 1) if feedbacks else 0.0

    # Recurring issues
    recurring_issues = detect_recurring_issues(db=db, days=30)

    return DashboardStats(
        total_complaints=total,
        open_complaints=open_count,
        in_progress_complaints=in_progress_count,
        resolved_complaints=resolved_count,
        overdue_complaints=overdue_count,
        status_counts=status_counts,
        category_counts=category_counts,
        priority_counts=priority_counts,
        recent_complaints=recent_complaints,
        overdue_list=overdue_list,
        overdue_threshold_days=threshold_days,
        avg_resolution_hours=avg_res_hours,
        resolution_rate=resolution_rate,
        overdue_percentage=overdue_percentage,
        sla_compliance_rate=sla_compliance_rate,
        avg_satisfaction_rating=avg_satisfaction,
        rating_distribution=rating_distribution,
        staff_workloads=staff_workloads,
        recurring_issues=recurring_issues
    )
