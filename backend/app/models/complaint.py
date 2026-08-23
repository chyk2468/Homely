from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class ComplaintStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class ComplaintPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class ComplaintCategory(str, enum.Enum):
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    CIVIL = "Civil"
    PEST_CONTROL = "Pest Control"
    ELEVATOR = "Elevator"
    CLEANING = "Cleaning & Sanitation"
    SECURITY = "Security"
    CARPENTRY = "Carpentry"
    OTHER = "Other"

class ActionType(str, enum.Enum):
    CREATED = "CREATED"
    STATUS_CHANGED = "STATUS_CHANGED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    ASSIGNED = "ASSIGNED"
    REOPEN_REQUESTED = "REOPEN_REQUESTED"
    REOPENED = "REOPENED"
    REOPEN_REJECTED = "REOPEN_REJECTED"
    COMMENT_ADDED = "COMMENT_ADDED"

class ComplaintCategoryModel(Base):
    __tablename__ = "complaint_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    sla_days = Column(Integer, default=7, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    status = Column(String(50), default=ComplaintStatus.OPEN.value, nullable=False, index=True)
    priority = Column(String(50), default=ComplaintPriority.MEDIUM.value, nullable=False, index=True)
    is_overdue = Column(Boolean, default=False, nullable=False, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    resident = relationship("User", back_populates="complaints", foreign_keys=[resident_id])
    assigned_staff = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to])
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="desc(ComplaintHistory.created_at)")
    comments = relationship("ComplaintComment", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintComment.created_at")
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("ComplaintFeedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    reopen_requests = relationship("ReopenRequest", back_populates="complaint", cascade="all, delete-orphan", order_by="desc(ReopenRequest.created_at)")

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action_type = Column(String(50), default=ActionType.STATUS_CHANGED.value, nullable=False, index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    old_priority = Column(String(50), nullable=True)
    new_priority = Column(String(50), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="history")
    actor = relationship("User", back_populates="actions", foreign_keys=[actor_id])

class ComplaintComment(Base):
    __tablename__ = "complaint_comments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="comments")
    author = relationship("User", back_populates="comments", foreign_keys=[author_id])

class ComplaintFeedback(Base):
    __tablename__ = "complaint_feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="feedback")
    resident = relationship("User", back_populates="feedbacks", foreign_keys=[resident_id])

class ReopenRequest(Base):
    __tablename__ = "reopen_requests"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="Pending", nullable=False, index=True)  # Pending, Approved, Rejected
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="reopen_requests")
    resident = relationship("User", foreign_keys=[resident_id])
    reviewer = relationship("User", foreign_keys=[admin_id])

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    original_extension = Column(String(20), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaint = relationship("Complaint", back_populates="attachments")
