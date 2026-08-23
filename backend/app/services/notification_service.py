import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType

logger = logging.getLogger("notification_service")

def create_in_app_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = NotificationType.STATUS_UPDATE.value,
    related_complaint_id: Optional[int] = None,
    related_notice_id: Optional[int] = None
) -> Optional[Notification]:
    """Create an in-app notification for a user."""
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            related_complaint_id=related_complaint_id,
            related_notice_id=related_notice_id,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        logger.error(f"Failed to create in-app notification for user {user_id}: {str(e)}")
        db.rollback()
        return None
