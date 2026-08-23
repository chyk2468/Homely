from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserResponse

class ComplaintBase(BaseModel):
    title: str
    category: str
    description: str

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class ComplaintPriorityUpdate(BaseModel):
    priority: str
    note: Optional[str] = None

class ComplaintAssignRequest(BaseModel):
    staff_id: Optional[int] = None
    note: Optional[str] = None

class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    actor_id: Optional[int] = None
    actor_name: str
    actor_role: str
    action_type: str = "STATUS_CHANGED"
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    old_priority: Optional[str] = None
    new_priority: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintCommentCreate(BaseModel):
    message: str

class ComplaintCommentResponse(BaseModel):
    id: int
    complaint_id: int
    author_id: int
    author_name: str
    author_role: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ComplaintFeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    resident_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReopenRequestCreate(BaseModel):
    reason: str

class ReopenRequestReview(BaseModel):
    decision: str  # "Approved" or "Rejected"
    admin_notes: Optional[str] = None

class ReopenRequestResponse(BaseModel):
    id: int
    complaint_id: int
    resident_id: int
    reason: str
    status: str
    admin_id: Optional[int] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ComplaintAttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    file_path: str
    original_extension: str
    file_size: int
    mime_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintResponse(ComplaintBase):
    id: int
    resident_id: int
    photo_url: Optional[str] = None
    status: str
    priority: str
    is_overdue: bool
    assigned_to: Optional[int] = None
    assigned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    resident: Optional[UserResponse] = None
    assigned_staff: Optional[UserResponse] = None

    # SLA Countdown Fields
    deadline: Optional[datetime] = None
    sla_remaining_seconds: Optional[int] = None
    sla_remaining_text: Optional[str] = None
    sla_status: Optional[str] = "normal"  # normal, approaching, overdue
    category_sla_days: Optional[int] = 7

    model_config = ConfigDict(from_attributes=True)

class ComplaintDetailResponse(ComplaintResponse):
    history: List[ComplaintHistoryResponse] = []
    comments: List[ComplaintCommentResponse] = []
    attachments: List[ComplaintAttachmentResponse] = []
    feedback: Optional[ComplaintFeedbackResponse] = None
    reopen_requests: List[ReopenRequestResponse] = []

    model_config = ConfigDict(from_attributes=True)

class CategorySlaCreate(BaseModel):
    name: str
    sla_days: int = Field(..., ge=1, le=365)
    is_active: Optional[bool] = True

class CategorySlaUpdate(BaseModel):
    sla_days: Optional[int] = Field(None, ge=1, le=365)
    is_active: Optional[bool] = None

class CategorySlaResponse(BaseModel):
    id: int
    name: str
    sla_days: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DuplicateCheckRequest(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""

class DuplicateItem(BaseModel):
    id: int
    title: str
    category: str
    status: str
    created_at: datetime
    similarity_score: float

class DuplicateCheckResponse(BaseModel):
    has_potential_duplicates: bool
    potential_duplicates: List[DuplicateItem] = []

class RecurringIssueItem(BaseModel):
    category: str
    location: str
    count: int
    recent_complaint_ids: List[int]
    sample_title: str
    recommendation: str
