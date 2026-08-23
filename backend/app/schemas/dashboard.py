from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.complaint import ComplaintResponse, RecurringIssueItem

class StaffWorkloadItem(BaseModel):
    staff_id: int
    staff_name: str
    specialization: Optional[str] = None
    active_tickets: int
    resolved_tickets: int

class DashboardSummary(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    overdue_complaints: int
    status_counts: Dict[str, int]
    category_counts: Dict[str, int]
    overdue_threshold_days: int
    avg_resolution_hours: float = 0.0
    resolution_rate: float = 0.0
    overdue_percentage: float = 0.0
    avg_satisfaction_rating: float = 0.0
    total_feedbacks: int = 0

class DashboardStats(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    overdue_complaints: int
    status_counts: Dict[str, int]
    category_counts: Dict[str, int]
    priority_counts: Dict[str, int]
    recent_complaints: List[ComplaintResponse]
    overdue_list: List[ComplaintResponse]
    overdue_threshold_days: int
    avg_resolution_hours: float = 0.0
    resolution_rate: float = 0.0
    overdue_percentage: float = 0.0
    sla_compliance_rate: float = 100.0
    avg_satisfaction_rating: float = 0.0
    rating_distribution: Dict[str, int] = {}
    staff_workloads: List[StaffWorkloadItem] = []
    recurring_issues: List[RecurringIssueItem] = []
