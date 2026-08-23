from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User, UserRole
from app.models.notice import Notice
from app.models.notification import NotificationType
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeResponse
from app.services.email_service import send_important_notice_email
from app.services.notification_service import create_in_app_notification
from app.services.audit_service import log_admin_action
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/notices", tags=["Notice Board"])

@router.get("", response_model=List[NoticeResponse])
def get_notices(db: Session = Depends(get_db)):
    """
    Retrieve notice board announcements.
    Important notices are pinned to the top, followed by chronological ordering.
    """
    notices = db.query(Notice).order_by(
        desc(Notice.is_important),
        desc(Notice.created_at)
    ).all()
    return notices

@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(
    notice_in: NoticeCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Admin endpoint: Post a new notice.
    If marked as important, it is pinned to the top, creates in-app notifications, and dispatches an email broadcast.
    """
    if not notice_in.title.strip() or not notice_in.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required.")

    notice = Notice(
        author_id=admin_user.id,
        title=notice_in.title.strip(),
        content=notice_in.content.strip(),
        is_important=notice_in.is_important
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # If marked important, dispatch notifications and broadcast email
    if notice.is_important:
        residents = db.query(User).filter(User.role == UserRole.RESIDENT.value).all()
        for res in residents:
            create_in_app_notification(
                db=db,
                user_id=res.id,
                title=f"Important Notice: {notice.title}",
                message=notice.content[:120] + ("..." if len(notice.content) > 120 else ""),
                notif_type=NotificationType.IMPORTANT_NOTICE.value,
                related_notice_id=notice.id
            )

        resident_emails = [r.email for r in residents if r.email]
        if resident_emails:
            send_important_notice_email(
                to_emails=resident_emails,
                notice_title=notice.title,
                notice_content=notice.content,
                author_name=admin_user.full_name
            )

    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="NOTICE_CREATED",
        target_entity="notice",
        target_id=str(notice.id),
        details=f"Created notice '{notice.title}' (Important={notice.is_important})"
    )

    return notice

@router.put("/{notice_id}", response_model=NoticeResponse)
def update_notice(
    notice_id: int,
    notice_in: NoticeUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Update an existing notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found.")

    if notice_in.title is not None:
        notice.title = notice_in.title.strip()
    if notice_in.content is not None:
        notice.content = notice_in.content.strip()
    if notice_in.is_important is not None:
        notice.is_important = notice_in.is_important

    db.commit()
    db.refresh(notice)

    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="NOTICE_UPDATED",
        target_entity="notice",
        target_id=str(notice.id),
        details=f"Updated notice '{notice.title}'"
    )

    return notice

@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin endpoint: Delete a notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found.")

    notice_title = notice.title
    db.delete(notice)
    db.commit()

    log_admin_action(
        db=db,
        admin_id=admin_user.id,
        admin_name=admin_user.full_name,
        action="NOTICE_DELETED",
        target_entity="notice",
        target_id=str(notice_id),
        details=f"Deleted notice '{notice_title}'"
    )

    return None
