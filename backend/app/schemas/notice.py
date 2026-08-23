from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserResponse

class NoticeBase(BaseModel):
    title: str
    content: str
    is_important: bool = False

class NoticeCreate(NoticeBase):
    pass

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_important: Optional[bool] = None

class NoticeResponse(NoticeBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
