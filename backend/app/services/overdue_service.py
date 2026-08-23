from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategoryModel
from app.models.setting import Setting
from app.config import settings

def get_overdue_threshold_days(db: Session) -> int:
    """Retrieve the global default overdue threshold in days from database settings."""
    setting = db.query(Setting).filter(Setting.key == "overdue_threshold_days").first()
    if setting and setting.value.isdigit():
        return int(setting.value)
    return settings.DEFAULT_OVERDUE_DAYS

def set_overdue_threshold_days(db: Session, days: int) -> int:
    """Update or create the configurable overdue threshold in days."""
    setting = db.query(Setting).filter(Setting.key == "overdue_threshold_days").first()
    if not setting:
        setting = Setting(
            key="overdue_threshold_days",
            value=str(days),
            description="Global number of days after which an unresolved complaint is marked overdue"
        )
        db.add(setting)
    else:
        setting.value = str(days)
    db.commit()
    db.refresh(setting)
    
    # Recalculate overdue flags immediately
    update_overdue_status(db)
    return days

def get_category_sla_map(db: Session) -> Dict[str, int]:
    """Return map of active category names to their SLA days."""
    cat_records = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.is_active == True).all()
    return {c.name.lower().strip(): c.sla_days for c in cat_records}

def get_complaint_sla_days(db: Session, category_name: str, global_default: Optional[int] = None) -> int:
    """Get SLA days for a specific category, falling back to global default."""
    if global_default is None:
        global_default = get_overdue_threshold_days(db)
    
    if not category_name:
        return global_default

    cat_record = db.query(ComplaintCategoryModel).filter(
        ComplaintCategoryModel.name.ilike(category_name.strip()),
        ComplaintCategoryModel.is_active == True
    ).first()

    if cat_record and cat_record.sla_days > 0:
        return cat_record.sla_days
    return global_default

def format_sla_countdown(deadline: datetime, current_dt: Optional[datetime] = None) -> Tuple[int, str, str]:
    """
    Format SLA remaining seconds, user-friendly text, and status:
    - 'normal': > 24 hours remaining
    - 'approaching': <= 24 hours remaining and > 0
    - 'overdue': <= 0
    """
    if current_dt is None:
        current_dt = datetime.utcnow()

    diff_seconds = int((deadline - current_dt).total_seconds())

    if diff_seconds > 0:
        days = diff_seconds // 86400
        hours = (diff_seconds % 86400) // 3600
        minutes = (diff_seconds % 3600) // 60

        if days > 0:
            text = f"{days}d {hours}h left"
        elif hours > 0:
            text = f"Due in {hours}h {minutes}m"
        else:
            text = f"Due in {max(1, minutes)}m"

        sla_status = "approaching" if diff_seconds <= 86400 else "normal"
    else:
        overdue_seconds = abs(diff_seconds)
        days = overdue_seconds // 86400
        hours = (overdue_seconds % 86400) // 3600
        
        if days > 0:
            text = f"Overdue by {days}d {hours}h"
        elif hours > 0:
            text = f"Overdue by {hours}h"
        else:
            minutes = max(1, overdue_seconds // 60)
            text = f"Overdue by {minutes}m"

        sla_status = "overdue"

    return diff_seconds, text, sla_status

def enrich_complaint_sla(complaint: Complaint, db: Session, global_default: Optional[int] = None) -> None:
    """Dynamically populate transient SLA attributes on a Complaint instance."""
    if global_default is None:
        global_default = get_overdue_threshold_days(db)

    sla_days = get_complaint_sla_days(db, complaint.category, global_default)
    deadline = complaint.created_at + timedelta(days=sla_days)

    if complaint.status == ComplaintStatus.RESOLVED.value:
        complaint.deadline = deadline
        complaint.sla_remaining_seconds = 0
        complaint.sla_remaining_text = "Resolved"
        complaint.sla_status = "normal"
        complaint.category_sla_days = sla_days
    else:
        rem_sec, rem_text, sla_stat = format_sla_countdown(deadline)
        complaint.deadline = deadline
        complaint.sla_remaining_seconds = rem_sec
        complaint.sla_remaining_text = rem_text
        complaint.sla_status = sla_stat
        complaint.category_sla_days = sla_days

def update_overdue_status(db: Session, default_threshold_days: Optional[int] = None) -> int:
    """
    Check all open/in-progress complaints and mark as overdue if created before category SLA.
    Resolved complaints are marked as is_overdue = False.
    Returns count of currently overdue complaints.
    """
    if default_threshold_days is None:
        default_threshold_days = get_overdue_threshold_days(db)

    now = datetime.utcnow()
    sla_map = get_category_sla_map(db)

    # All unresolved complaints
    unresolved_complaints = db.query(Complaint).filter(Complaint.status != ComplaintStatus.RESOLVED.value).all()
    
    overdue_count = 0
    for complaint in unresolved_complaints:
        cat_key = complaint.category.lower().strip() if complaint.category else ""
        sla_days = sla_map.get(cat_key, default_threshold_days)
        cutoff_date = now - timedelta(days=sla_days)

        is_now_overdue = complaint.created_at <= cutoff_date
        if complaint.is_overdue != is_now_overdue:
            complaint.is_overdue = is_now_overdue
        if is_now_overdue:
            overdue_count += 1

    # Ensure resolved complaints are never marked overdue
    resolved_complaints = db.query(Complaint).filter(
        Complaint.status == ComplaintStatus.RESOLVED.value,
        Complaint.is_overdue == True
    ).all()
    for rc in resolved_complaints:
        rc.is_overdue = False

    db.commit()
    return overdue_count
