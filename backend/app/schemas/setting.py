from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(SettingBase):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
