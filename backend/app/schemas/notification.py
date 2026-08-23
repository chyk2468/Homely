from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    related_complaint_id: Optional[int] = None
    related_notice_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationCountResponse(BaseModel):
    unread_count: int
