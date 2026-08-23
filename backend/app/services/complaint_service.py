import os
import io
import csv
import uuid
import aiofiles
from datetime import datetime, timedelta
from typing import Optional, List, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from app.config import settings
from app.models.complaint import (
    Complaint,
    ComplaintHistory,
    ComplaintStatus,
    ComplaintPriority,
    ActionType,
    ComplaintComment,
    ComplaintFeedback,
    ReopenRequest,
    ComplaintAttachment,
)
from app.models.user import User, UserRole
from app.models.notification import NotificationType
from app.services.email_service import send_status_update_email
from app.services.overdue_service import update_overdue_status, enrich_complaint_sla, get_overdue_threshold_days
from app.services.notification_service import create_in_app_notification

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

async def save_uploaded_photo(file: UploadFile) -> Tuple[str, str, int, str]:
    """
    Validate and save uploaded photo with a secure UUID filename.
    Returns (file_url, original_extension, file_size, mime_type).
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty filename provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    content_type = file.content_type.lower() if file.content_type else "image/jpeg"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{content_type}'. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    file_size = 0
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    file_too_large = False

    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > max_size_bytes:
                    file_too_large = True
                    break
                await buffer.write(chunk)
    finally:
        if file_too_large and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

    if file_too_large:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )

    file_url = f"/uploads/{unique_filename}"
    return file_url, ext, file_size, content_type

def create_complaint(
    db: Session,
    resident: User,
    title: str,
    category: str,
    description: str,
    photo_url: Optional[str] = None,
    attachments_meta: Optional[List[Tuple[str, str, int, str]]] = None
) -> Complaint:
    """Create a new complaint, add optional attachments, and record initial history entry."""
    complaint = Complaint(
        resident_id=resident.id,
        title=title.strip(),
        category=category.strip(),
        description=description.strip(),
        photo_url=photo_url,
        status=ComplaintStatus.OPEN.value,
        priority=ComplaintPriority.MEDIUM.value,
        is_overdue=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(complaint)
    db.flush()

    # Save multiple attachments if provided
    if attachments_meta:
        for f_path, f_ext, f_size, f_mime in attachments_meta:
            att = ComplaintAttachment(
                complaint_id=complaint.id,
                file_path=f_path,
                original_extension=f_ext,
                file_size=f_size,
                mime_type=f_mime,
                created_at=datetime.utcnow()
            )
            db.add(att)

    # Record initial lifecycle history
    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=resident.id,
        actor_name=resident.full_name,
        actor_role=resident.role,
        action_type=ActionType.CREATED.value,
        old_status=None,
        new_status=ComplaintStatus.OPEN.value,
        old_priority=None,
        new_priority=ComplaintPriority.MEDIUM.value,
        note="Complaint registered by resident.",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    # Notify administrators about new complaint
    admins = db.query(User).filter(User.role == UserRole.ADMIN.value).all()
    for admin in admins:
        create_in_app_notification(
            db=db,
            user_id=admin.id,
            title=f"New Complaint #{complaint.id}",
            message=f"{resident.full_name} ({resident.flat_number or 'Resident'}) raised '{complaint.title}'",
            notif_type=NotificationType.STATUS_UPDATE.value,
            related_complaint_id=complaint.id
        )

    enrich_complaint_sla(complaint, db)
    return complaint

def update_complaint_status(
    db: Session,
    complaint: Complaint,
    actor: User,
    new_status: str,
    note: Optional[str] = None
) -> Complaint:
    """Update complaint status, write history entry, dispatch email, and create in-app notification."""
    valid_statuses = [s.value for s in ComplaintStatus]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed values: {valid_statuses}"
        )

    old_status = complaint.status
    if old_status == new_status:
        enrich_complaint_sla(complaint, db)
        return complaint

    complaint.status = new_status
    complaint.updated_at = datetime.utcnow()

    if new_status == ComplaintStatus.RESOLVED.value:
        complaint.resolved_at = datetime.utcnow()
        complaint.is_overdue = False
    else:
        complaint.resolved_at = None

    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role,
        action_type=ActionType.STATUS_CHANGED.value,
        old_status=old_status,
        new_status=new_status,
        old_priority=complaint.priority,
        new_priority=complaint.priority,
        note=note.strip() if note else f"Status changed from {old_status} to {new_status}",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    # In-App notification for resident
    create_in_app_notification(
        db=db,
        user_id=complaint.resident_id,
        title=f"Complaint #{complaint.id} is now {new_status}",
        message=f"Status updated to {new_status} by {actor.full_name} ({actor.role.capitalize()})." + (f" Note: '{note}'" if note else ""),
        notif_type=NotificationType.STATUS_UPDATE.value,
        related_complaint_id=complaint.id
    )

    # Email notification to resident
    if complaint.resident and complaint.resident.email:
        send_status_update_email(
            to_email=complaint.resident.email,
            resident_name=complaint.resident.full_name,
            complaint_id=complaint.id,
            complaint_title=complaint.title,
            old_status=old_status,
            new_status=new_status,
            note=note
        )

    enrich_complaint_sla(complaint, db)
    return complaint

def update_complaint_priority(
    db: Session,
    complaint: Complaint,
    actor: User,
    new_priority: str,
    note: Optional[str] = None
) -> Complaint:
    """Update complaint priority, write history entry, and notify resident."""
    valid_priorities = [p.value for p in ComplaintPriority]
    if new_priority not in valid_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{new_priority}'. Allowed values: {valid_priorities}"
        )

    old_priority = complaint.priority
    if old_priority == new_priority:
        enrich_complaint_sla(complaint, db)
        return complaint

    complaint.priority = new_priority
    complaint.updated_at = datetime.utcnow()

    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role,
        action_type=ActionType.PRIORITY_CHANGED.value,
        old_status=complaint.status,
        new_status=complaint.status,
        old_priority=old_priority,
        new_priority=new_priority,
        note=note.strip() if note else f"Priority changed from {old_priority} to {new_priority}",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    # In-App notification for resident
    create_in_app_notification(
        db=db,
        user_id=complaint.resident_id,
        title=f"Complaint #{complaint.id} Priority: {new_priority}",
        message=f"Priority was adjusted from {old_priority} to {new_priority} by {actor.full_name}.",
        notif_type=NotificationType.PRIORITY_UPDATE.value,
        related_complaint_id=complaint.id
    )

    enrich_complaint_sla(complaint, db)
    return complaint

def assign_staff_to_complaint(
    db: Session,
    complaint: Complaint,
    actor: User,
    staff_id: Optional[int],
    note: Optional[str] = None
) -> Complaint:
    """Assign or reassign a complaint to a maintenance staff user."""
    staff_user = None
    if staff_id is not None:
        staff_user = db.query(User).filter(User.id == staff_id, User.role == UserRole.STAFF.value).first()
        if not staff_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found or user is not a staff member."
            )
        if not staff_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign complaint to an inactive staff member."
            )

    complaint.assigned_to = staff_id
    complaint.assigned_at = datetime.utcnow() if staff_id else None
    complaint.updated_at = datetime.utcnow()

    staff_name_display = staff_user.full_name if staff_user else "Unassigned"
    remark = note.strip() if note else f"Assigned to {staff_name_display} ({staff_user.specialization if staff_user and staff_user.specialization else 'Staff'})"

    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role,
        action_type=ActionType.ASSIGNED.value,
        old_status=complaint.status,
        new_status=complaint.status,
        old_priority=complaint.priority,
        new_priority=complaint.priority,
        note=remark,
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    # In-App notification for staff
    if staff_user:
        create_in_app_notification(
            db=db,
            user_id=staff_user.id,
            title=f"New Assignment: Complaint #{complaint.id}",
            message=f"You have been assigned to #{complaint.id} ({complaint.title}) by {actor.full_name}.",
            notif_type=NotificationType.ASSIGNMENT.value,
            related_complaint_id=complaint.id
        )

    # In-App notification for resident
    create_in_app_notification(
        db=db,
        user_id=complaint.resident_id,
        title=f"Staff Assigned to #{complaint.id}",
        message=f"{staff_name_display} has been assigned to handle your complaint.",
        notif_type=NotificationType.ASSIGNMENT.value,
        related_complaint_id=complaint.id
    )

    enrich_complaint_sla(complaint, db)
    return complaint

def add_complaint_comment(
    db: Session,
    complaint: Complaint,
    author: User,
    message: str
) -> ComplaintComment:
    """Add a discussion comment to a complaint."""
    if not message.strip():
        raise HTTPException(status_code=400, detail="Comment message cannot be empty.")

    comment = ComplaintComment(
        complaint_id=complaint.id,
        author_id=author.id,
        author_name=author.full_name,
        author_role=author.role,
        message=message.strip(),
        created_at=datetime.utcnow()
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Notify counter-parties
    # 1. If author is not resident, notify resident
    if author.id != complaint.resident_id:
        create_in_app_notification(
            db=db,
            user_id=complaint.resident_id,
            title=f"New Message on Complaint #{complaint.id}",
            message=f"{author.full_name} ({author.role.capitalize()}): '{message[:80]}...'",
            notif_type=NotificationType.COMMENT.value,
            related_complaint_id=complaint.id
        )

    # 2. If author is resident or admin, notify assigned staff if any
    if complaint.assigned_to and author.id != complaint.assigned_to:
        create_in_app_notification(
            db=db,
            user_id=complaint.assigned_to,
            title=f"New Message on Complaint #{complaint.id}",
            message=f"{author.full_name} ({author.role.capitalize()}): '{message[:80]}...'",
            notif_type=NotificationType.COMMENT.value,
            related_complaint_id=complaint.id
        )

    return comment

def submit_complaint_feedback(
    db: Session,
    complaint: Complaint,
    resident: User,
    rating: int,
    comment: Optional[str] = None
) -> ComplaintFeedback:
    """Submit resident satisfaction feedback for a resolved complaint."""
    if complaint.resident_id != resident.id and resident.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only the resident who raised this complaint can submit feedback.")

    if complaint.status != ComplaintStatus.RESOLVED.value:
        raise HTTPException(status_code=400, detail="Feedback can only be submitted for Resolved complaints.")

    existing_feedback = db.query(ComplaintFeedback).filter(ComplaintFeedback.complaint_id == complaint.id).first()
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback has already been submitted for this complaint.")

    feedback = ComplaintFeedback(
        complaint_id=complaint.id,
        resident_id=resident.id,
        rating=rating,
        comment=comment.strip() if comment else None,
        created_at=datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Notify admins about feedback
    admins = db.query(User).filter(User.role == UserRole.ADMIN.value).all()
    for admin in admins:
        create_in_app_notification(
            db=db,
            user_id=admin.id,
            title=f"Feedback on Complaint #{complaint.id}",
            message=f"Rating: {rating}/5 from {resident.full_name}" + (f": '{comment}'" if comment else ""),
            notif_type=NotificationType.FEEDBACK.value,
            related_complaint_id=complaint.id
        )

    return feedback

def submit_reopen_request(
    db: Session,
    complaint: Complaint,
    resident: User,
    reason: str
) -> ReopenRequest:
    """Resident submits a request to reopen a resolved complaint."""
    if complaint.resident_id != resident.id and resident.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only the complaint owner can request to reopen.")

    if complaint.status != ComplaintStatus.RESOLVED.value:
        raise HTTPException(status_code=400, detail="Only Resolved complaints can be requested for reopen.")

    pending_req = db.query(ReopenRequest).filter(
        ReopenRequest.complaint_id == complaint.id,
        ReopenRequest.status == "Pending"
    ).first()
    if pending_req:
        raise HTTPException(status_code=400, detail="A reopen request is already pending review for this complaint.")

    reopen_req = ReopenRequest(
        complaint_id=complaint.id,
        resident_id=resident.id,
        reason=reason.strip(),
        status="Pending",
        created_at=datetime.utcnow()
    )
    db.add(reopen_req)

    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        actor_id=resident.id,
        actor_name=resident.full_name,
        actor_role=resident.role,
        action_type=ActionType.REOPEN_REQUESTED.value,
        old_status=complaint.status,
        new_status=complaint.status,
        old_priority=complaint.priority,
        new_priority=complaint.priority,
        note=f"Reopen Requested: {reason.strip()}",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(reopen_req)

    # Notify admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN.value).all()
    for admin in admins:
        create_in_app_notification(
            db=db,
            user_id=admin.id,
            title=f"Reopen Request for Complaint #{complaint.id}",
            message=f"{resident.full_name} requested reopen: '{reason[:80]}...'",
            notif_type=NotificationType.REOPEN_REQUEST.value,
            related_complaint_id=complaint.id
        )

    return reopen_req

def review_reopen_request(
    db: Session,
    reopen_req: ReopenRequest,
    admin: User,
    decision: str,
    admin_notes: Optional[str] = None
) -> ReopenRequest:
    """Admin approves or rejects a reopen request."""
    if decision not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'Approved' or 'Rejected'.")

    reopen_req.status = decision
    reopen_req.admin_id = admin.id
    reopen_req.admin_notes = admin_notes.strip() if admin_notes else None
    reopen_req.reviewed_at = datetime.utcnow()

    complaint = reopen_req.complaint
    if decision == "Approved":
        complaint.status = ComplaintStatus.IN_PROGRESS.value
        complaint.resolved_at = None
        complaint.updated_at = datetime.utcnow()

        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=admin.id,
            actor_name=admin.full_name,
            actor_role=admin.role,
            action_type=ActionType.REOPENED.value,
            old_status=ComplaintStatus.RESOLVED.value,
            new_status=ComplaintStatus.IN_PROGRESS.value,
            old_priority=complaint.priority,
            new_priority=complaint.priority,
            note=f"Reopen Request Approved by {admin.full_name}. Reason: {admin_notes or 'Issue still persists'}",
            created_at=datetime.utcnow()
        )
        db.add(history_entry)
    else:
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=admin.id,
            actor_name=admin.full_name,
            actor_role=admin.role,
            action_type=ActionType.REOPEN_REJECTED.value,
            old_status=ComplaintStatus.RESOLVED.value,
            new_status=ComplaintStatus.RESOLVED.value,
            old_priority=complaint.priority,
            new_priority=complaint.priority,
            note=f"Reopen Request Rejected by {admin.full_name}. Reason: {admin_notes or 'Work verified completed'}",
            created_at=datetime.utcnow()
        )
        db.add(history_entry)

    db.commit()
    db.refresh(reopen_req)

    # In-App notification to resident
    create_in_app_notification(
        db=db,
        user_id=reopen_req.resident_id,
        title=f"Reopen Request {decision} for #{complaint.id}",
        message=f"Admin {decision.lower()} your reopen request." + (f" Note: '{admin_notes}'" if admin_notes else ""),
        notif_type=NotificationType.REOPEN_REVIEW.value,
        related_complaint_id=complaint.id
    )

    return reopen_req

def parse_date_filter(date_str: Optional[str]) -> Optional[datetime]:
    """Parse date query string into datetime object."""
    if not date_str:
        return None
    date_clean = date_str.strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_clean, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(date_clean)
    except Exception:
        return None

def detect_duplicate_complaints(
    db: Session,
    title: str,
    category: str,
    description: str = "",
    time_window_days: int = 30
) -> List[Dict[str, Any]]:
    """
    Detect potentially duplicate complaints using category matching,
    keyword token overlap, and recent time window.
    """
    cutoff = datetime.utcnow() - timedelta(days=time_window_days)
    recent_complaints = db.query(Complaint).filter(
        Complaint.created_at >= cutoff
    ).all()

    target_tokens = set(t.lower() for t in (title + " " + description).split() if len(t) > 2)
    potential_duplicates = []

    for c in recent_complaints:
        # Check category match
        cat_match = c.category.lower().strip() == category.lower().strip()
        c_tokens = set(t.lower() for t in (c.title + " " + c.description).split() if len(t) > 2)
        
        if not target_tokens or not c_tokens:
            continue

        intersection = target_tokens.intersection(c_tokens)
        union = target_tokens.union(c_tokens)
        jaccard = len(intersection) / len(union) if union else 0

        # Score bonus for category match
        score = jaccard * (1.3 if cat_match else 0.8)

        if score >= 0.25 or (cat_match and len(intersection) >= 2):
            potential_duplicates.append({
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "status": c.status,
                "created_at": c.created_at,
                "similarity_score": round(min(1.0, score), 2)
            })

    potential_duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return potential_duplicates[:5]

def detect_recurring_issues(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    """Identify categories or locations with repeated complaints in the last 30 days."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent = db.query(Complaint).join(User, Complaint.resident_id == User.id).filter(
        Complaint.created_at >= cutoff
    ).all()

    # Group by category + flat prefix / tower
    groupings = {}
    for c in recent:
        loc = c.resident.flat_number if c.resident and c.resident.flat_number else "Common Area"
        # Extract tower or block if present
        tower = loc.split(",")[1].strip() if "," in loc else (loc.split("-")[0].strip() if "-" in loc else loc)
        key = (c.category, tower)

        if key not in groupings:
            groupings[key] = []
        groupings[key].append(c)

    results = []
    for (cat, loc), group in groupings.items():
        if len(group) >= 2:
            results.append({
                "category": cat,
                "location": loc,
                "count": len(group),
                "recent_complaint_ids": [c.id for c in group[:5]],
                "sample_title": group[0].title,
                "recommendation": f"Detected {len(group)} {cat} issues in {loc} over the last {days} days. Preventive inspection recommended."
            })

    results.sort(key=lambda x: x["count"], reverse=True)
    return results

def get_filtered_complaints(
    db: Session,
    resident_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    sort_by_overdue_first: bool = True
) -> List[Complaint]:
    """Retrieve complaints with flexible filtering, search, and overdue prioritization."""
    update_overdue_status(db)

    query = db.query(Complaint)

    if resident_id is not None:
        query = query.filter(Complaint.resident_id == resident_id)

    if assigned_to is not None:
        query = query.filter(Complaint.assigned_to == assigned_to)

    if category:
        query = query.filter(Complaint.category == category)

    if status_filter:
        query = query.filter(Complaint.status == status_filter)

    if priority:
        query = query.filter(Complaint.priority == priority)

    if is_overdue is not None:
        query = query.filter(Complaint.is_overdue == is_overdue)

    parsed_date_from = parse_date_filter(date_from)
    if parsed_date_from:
        query = query.filter(Complaint.created_at >= parsed_date_from)

    parsed_date_to = parse_date_filter(date_to)
    if parsed_date_to:
        if parsed_date_to.hour == 0 and parsed_date_to.minute == 0 and parsed_date_to.second == 0:
            parsed_date_to = parsed_date_to.replace(hour=23, minute=59, second=59)
        query = query.filter(Complaint.created_at <= parsed_date_to)

    if search:
        search_clean = search.strip()
        search_pattern = f"%{search_clean}%"

        # Check if search is numeric ID (e.g., "#12" or "12")
        id_search = search_clean.lstrip("#")
        id_filter = None
        if id_search.isdigit():
            id_filter = Complaint.id == int(id_search)

        query = query.outerjoin(User, Complaint.resident_id == User.id)
        
        search_conditions = [
            Complaint.title.ilike(search_pattern),
            Complaint.description.ilike(search_pattern),
            Complaint.category.ilike(search_pattern),
            User.full_name.ilike(search_pattern),
            User.email.ilike(search_pattern),
            User.flat_number.ilike(search_pattern)
        ]
        if id_filter is not None:
            search_conditions.append(id_filter)

        query = query.filter(or_(*search_conditions))

    if sort_by_overdue_first:
        query = query.order_by(desc(Complaint.is_overdue), desc(Complaint.created_at))
    else:
        query = query.order_by(desc(Complaint.created_at))

    complaints = query.all()
    global_default = get_overdue_threshold_days(db)
    for c in complaints:
        enrich_complaint_sla(c, db, global_default)

    return complaints

def generate_complaints_csv(complaints: List[Complaint]) -> str:
    """Export complaint list into CSV format string."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Complaint ID",
        "Title",
        "Category",
        "Priority",
        "Status",
        "Is Overdue",
        "Resident Name",
        "Resident Email",
        "Flat Number",
        "Assigned Staff",
        "Created At (UTC)",
        "Resolved At (UTC)",
        "SLA Remaining Text"
    ])

    for c in complaints:
        writer.writerow([
            c.id,
            c.title,
            c.category,
            c.priority,
            c.status,
            "Yes" if c.is_overdue else "No",
            c.resident.full_name if c.resident else "N/A",
            c.resident.email if c.resident else "N/A",
            c.resident.flat_number if c.resident else "N/A",
            c.assigned_staff.full_name if c.assigned_staff else "Unassigned",
            c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "N/A",
            c.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if c.resolved_at else "N/A",
            getattr(c, "sla_remaining_text", "N/A")
        ])

    return output.getvalue()
