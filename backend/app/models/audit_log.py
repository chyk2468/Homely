from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    admin_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # USER_CREATED, ROLE_CHANGED, SLA_UPDATED, NOTICE_CREATED, NOTICE_DELETED, STAFF_ASSIGNED, etc.
    target_entity = Column(String(100), nullable=False, index=True)  # user, complaint, notice, setting, category
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id])
