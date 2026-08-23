from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class NotificationType(str, enum.Enum):
    STATUS_UPDATE = "STATUS_UPDATE"
    PRIORITY_UPDATE = "PRIORITY_UPDATE"
    ASSIGNMENT = "ASSIGNMENT"
    IMPORTANT_NOTICE = "IMPORTANT_NOTICE"
    COMMENT = "COMMENT"
    REOPEN_REQUEST = "REOPEN_REQUEST"
    REOPEN_REVIEW = "REOPEN_REVIEW"
    FEEDBACK = "FEEDBACK"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default=NotificationType.STATUS_UPDATE.value, nullable=False, index=True)
    related_complaint_id = Column(Integer, nullable=True, index=True)
    related_notice_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
