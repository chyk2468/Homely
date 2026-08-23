import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AdminAuditLog

logger = logging.getLogger("audit_service")

def log_admin_action(
    db: Session,
    admin_id: Optional[int],
    admin_name: str,
    action: str,
    target_entity: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None
) -> Optional[AdminAuditLog]:
    """Record an administrative action into the audit log."""
    try:
        log_entry = AdminAuditLog(
            admin_id=admin_id,
            admin_name=admin_name,
            action=action,
            target_entity=target_entity,
            target_id=str(target_id) if target_id is not None else None,
            details=details
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record admin audit log: {str(e)}")
        db.rollback()
        return None
