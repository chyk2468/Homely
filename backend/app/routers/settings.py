from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.setting import SettingResponse, SettingUpdate
from app.services.overdue_service import get_overdue_threshold_days, set_overdue_threshold_days
from app.dependencies import require_admin

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/overdue-threshold")
def get_threshold(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Get current overdue threshold in days."""
    days = get_overdue_threshold_days(db)
    return {"overdue_threshold_days": days}

@router.put("/overdue-threshold")
def update_threshold(
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Configure overdue threshold in days and recalculate all complaints."""
    try:
        days = int(payload.value)
        if days < 1 or days > 365:
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Overdue threshold must be an integer between 1 and 365 days."
        )

    updated_days = set_overdue_threshold_days(db, days)
    return {"message": "Overdue threshold updated successfully.", "overdue_threshold_days": updated_days}
