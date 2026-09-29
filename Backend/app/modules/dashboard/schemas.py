from typing import Optional, List
from pydantic import BaseModel
from app.modules.knowledge.schemas import ResourceRead
from app.modules.learning_paths.schemas import LearningPathRead
from app.modules.submissions.schemas import SubmissionRead
from app.modules.learning.schemas import LearningEntryRead

class DashboardStatsRead(BaseModel):
    user_name: str
    greeting: str
    learning_progress_pct: float
    total_learning_entries: int
    completed_learning_entries: int
    pending_submissions: int
    approved_submissions: int
    resources_explored: int
    total_org_resources: int
    total_learning_paths: int
    recent_resources: List[ResourceRead] = []
    active_paths: List[LearningPathRead] = []
    recent_entries: List[LearningEntryRead] = []
    pending_reviews_count: Optional[int] = 0
