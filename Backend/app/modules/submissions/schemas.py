from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import SubmissionStatus
from app.modules.knowledge.schemas import AuthorRead
from app.modules.learning.schemas import LearningEntryRead

class SubmissionHistoryRead(BaseModel):
    id: int
    submission_id: int
    status: SubmissionStatus
    actor_id: Optional[int] = None
    actor: Optional[AuthorRead] = None
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    learning_entry_id: Optional[int] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    learning_entry_id: Optional[int] = None

class SubmissionReviewRequest(BaseModel):
    status: SubmissionStatus  # APPROVED, REJECTED, UNDER_REVIEW
    feedback: str = Field(..., min_length=2)

class SubmissionRead(BaseModel):
    id: int
    user_id: int
    user: AuthorRead
    learning_entry_id: Optional[int] = None
    learning_entry: Optional[LearningEntryRead] = None
    title: str
    description: Optional[str] = None
    status: SubmissionStatus
    reviewer_id: Optional[int] = None
    reviewer: Optional[AuthorRead] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    history: List[SubmissionHistoryRead] = []

    class Config:
        from_attributes = True
