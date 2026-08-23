from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_name: str
    action: str
    target_entity: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
