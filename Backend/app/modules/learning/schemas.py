from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import LearningStatus
from app.modules.knowledge.schemas import ResourceRead, AuthorRead

class LearningEntryBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5, description="What I learned today")
    work_completed: Optional[str] = None
    learning_date: date = Field(default_factory=date.today)
    status: LearningStatus = LearningStatus.IN_PROGRESS
    resource_ids: List[int] = []

class LearningEntryCreate(LearningEntryBase):
    pass

class LearningEntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    work_completed: Optional[str] = None
    learning_date: Optional[date] = None
    status: Optional[LearningStatus] = None
    resource_ids: Optional[List[int]] = None

class LearningEntryRead(BaseModel):
    id: int
    user_id: int
    user: AuthorRead
    title: str
    description: str
    work_completed: Optional[str] = None
    learning_date: date
    status: LearningStatus
    resources: List[ResourceRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
