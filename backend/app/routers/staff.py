from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintResponse, ComplaintDetailResponse, ComplaintStatusUpdate
from app.services.complaint_service import update_complaint_status, get_filtered_complaints
from app.dependencies import require_staff

router = APIRouter(prefix="/staff", tags=["Maintenance Staff Operations"])

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_assigned_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff)
):
    """Retrieve all complaints assigned to the authenticated staff member."""
    return get_filtered_complaints(
        db=db,
        assigned_to=staff_user.id,
        status_filter=status,
        priority=priority,
        is_overdue=is_overdue,
        search=search,
        sort_by_overdue_first=True
    )

@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintDetailResponse)
def update_assigned_complaint_status(
    complaint_id: int,
    status_in: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff)
):
    """Staff endpoint: Update status of an assigned complaint and log remarks."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if complaint.assigned_to != staff_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only update status for complaints assigned to you."
        )

    return update_complaint_status(
        db=db,
        complaint=complaint,
        actor=staff_user,
        new_status=status_in.status,
        note=status_in.note
    )
