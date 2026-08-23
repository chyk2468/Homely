from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintCategory, ComplaintCategoryModel, ComplaintStatus
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintHistoryResponse,
    ComplaintStatusUpdate,
    ComplaintPriorityUpdate,
    ComplaintCommentCreate,
    ComplaintCommentResponse,
    ComplaintFeedbackCreate,
    ComplaintFeedbackResponse,
    ReopenRequestCreate,
    ReopenRequestResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
)
from app.services.complaint_service import (
    save_uploaded_photo,
    create_complaint,
    update_complaint_status,
    update_complaint_priority,
    get_filtered_complaints,
    add_complaint_comment,
    submit_complaint_feedback,
    submit_reopen_request,
    detect_duplicate_complaints,
)
from app.services.overdue_service import enrich_complaint_sla
from app.dependencies import get_current_user, require_admin, require_staff_or_admin

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def raise_complaint(
    request: Request,
    title: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    photos: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resident endpoint: Raise a maintenance complaint with category, description,
    and optional supporting photo uploads (supports single photo or multiple attachments).
    """
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty.")
    if not description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    # Process all uploaded files
    all_files: List[UploadFile] = []
    if photo and photo.filename:
        all_files.append(photo)
    if photos:
        for p in photos:
            if p and p.filename and p not in all_files:
                all_files.append(p)

    primary_photo_url = None
    attachments_meta = []

    for uploaded_file in all_files:
        f_url, f_ext, f_size, f_mime = await save_uploaded_photo(uploaded_file)
        if not primary_photo_url:
            primary_photo_url = f_url
        attachments_meta.append((f_url, f_ext, f_size, f_mime))

    complaint = create_complaint(
        db=db,
        resident=current_user,
        title=title,
        category=category,
        description=description,
        photo_url=primary_photo_url,
        attachments_meta=attachments_meta
    )
    return complaint

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate(
    payload: DuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check for potential existing duplicate complaints before submission."""
    duplicates = detect_duplicate_complaints(
        db=db,
        title=payload.title,
        category=payload.category,
        description=payload.description or "",
        time_window_days=30
    )
    return DuplicateCheckResponse(
        has_potential_duplicates=len(duplicates) > 0,
        potential_duplicates=duplicates
    )

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
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
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve complaints.
    - Residents see only their own complaints.
    - Staff see assigned complaints (or filtered).
    - Admins see all complaints with multi-criteria filtering.
    """
    scoped_resident_id = resident_id
    scoped_assigned_to = assigned_to

    if current_user.role == UserRole.RESIDENT.value:
        scoped_resident_id = current_user.id
    elif current_user.role == UserRole.STAFF.value and scoped_assigned_to is None:
        # Default staff view is their own assigned queue if not explicitly querying
        scoped_assigned_to = current_user.id

    complaints = get_filtered_complaints(
        db=db,
        resident_id=scoped_resident_id,
        assigned_to=scoped_assigned_to,
        category=category,
        status_filter=status,
        priority=priority,
        is_overdue=is_overdue,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by_overdue_first=(current_user.role in [UserRole.ADMIN.value, UserRole.STAFF.value])
    )
    return complaints

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Return standard active complaint categories."""
    db_cats = db.query(ComplaintCategoryModel).filter(ComplaintCategoryModel.is_active == True).all()
    if db_cats:
        return [c.name for c in db_cats]
    return [c.value for c in ComplaintCategory]

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single complaint with its complete status and priority modification history.
    - Residents can only view their own complaint.
    - Staff can view complaints assigned to them (or all if authorized).
    - Admins can view any complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESIDENT.value and complaint.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You cannot view another resident's complaint.")

    enrich_complaint_sla(complaint, db)
    return complaint

@router.get("/{complaint_id}/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the complete chronological audit history for a complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESIDENT.value and complaint.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You cannot view history for another resident's complaint.")

    return complaint.history

@router.get("/{complaint_id}/comments", response_model=List[ComplaintCommentResponse])
def get_complaint_comments(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve discussion comments on a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESIDENT.value and complaint.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You cannot view comments for another resident's complaint.")

    return complaint.comments

@router.post("/{complaint_id}/comments", response_model=ComplaintCommentResponse, status_code=status.HTTP_201_CREATED)
def post_complaint_comment(
    complaint_id: int,
    comment_in: ComplaintCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a discussion comment to a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESIDENT.value and complaint.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You cannot comment on another resident's complaint.")

    comment = add_complaint_comment(
        db=db,
        complaint=complaint,
        author=current_user,
        message=comment_in.message
    )
    return comment

@router.post("/{complaint_id}/feedback", response_model=ComplaintFeedbackResponse, status_code=status.HTTP_201_CREATED)
def post_complaint_feedback(
    complaint_id: int,
    feedback_in: ComplaintFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resident submits satisfaction rating and feedback after complaint resolution."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    feedback = submit_complaint_feedback(
        db=db,
        complaint=complaint,
        resident=current_user,
        rating=feedback_in.rating,
        comment=feedback_in.comment
    )
    return feedback

@router.get("/{complaint_id}/feedback", response_model=Optional[ComplaintFeedbackResponse])
def get_complaint_feedback(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve satisfaction feedback for a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.RESIDENT.value and complaint.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return complaint.feedback

@router.post("/{complaint_id}/reopen-request", response_model=ReopenRequestResponse, status_code=status.HTTP_201_CREATED)
def post_reopen_request(
    complaint_id: int,
    reopen_in: ReopenRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resident requests to reopen a resolved complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    reopen_req = submit_reopen_request(
        db=db,
        complaint=complaint,
        resident=current_user,
        reason=reopen_in.reason
    )
    return reopen_req

@router.patch("/{complaint_id}/status", response_model=ComplaintDetailResponse)
def change_complaint_status(
    complaint_id: int,
    status_in: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    """
    Admin or Assigned Staff endpoint: Update complaint status (Open, In Progress, Resolved).
    Records timestamp, actor name/role, action_type, and note into immutable history.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if current_user.role == UserRole.STAFF.value and complaint.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Staff can only update status for complaints assigned to them.")

    updated_complaint = update_complaint_status(
        db=db,
        complaint=complaint,
        actor=current_user,
        new_status=status_in.status,
        note=status_in.note
    )
    return updated_complaint

@router.patch("/{complaint_id}/priority", response_model=ComplaintDetailResponse)
def change_complaint_priority(
    complaint_id: int,
    priority_in: ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update complaint priority (Low, Medium, High)."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    updated_complaint = update_complaint_priority(
        db=db,
        complaint=complaint,
        actor=admin_user,
        new_priority=priority_in.priority,
        note=priority_in.note
    )
    return updated_complaint
