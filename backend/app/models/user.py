from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    RESIDENT = "resident"
    ADMIN = "admin"
    STAFF = "staff"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.RESIDENT.value, nullable=False, index=True)
    flat_number = Column(String(50), nullable=True)
    phone_number = Column(String(50), nullable=True)
    specialization = Column(String(100), nullable=True)  # Plumbing, Electrical, Cleaning, Security, General Maintenance
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="resident", foreign_keys="Complaint.resident_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_staff", foreign_keys="Complaint.assigned_to")
    notices = relationship("Notice", back_populates="author", foreign_keys="Notice.author_id")
    actions = relationship("ComplaintHistory", back_populates="actor", foreign_keys="ComplaintHistory.actor_id")
    comments = relationship("ComplaintComment", back_populates="author", foreign_keys="ComplaintComment.author_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", foreign_keys="Notification.user_id")
    feedbacks = relationship("ComplaintFeedback", back_populates="resident", foreign_keys="ComplaintFeedback.resident_id")

