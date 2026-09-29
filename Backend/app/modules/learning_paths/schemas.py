from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.modules.knowledge.schemas import ResourceRead

class ModuleResourceCreate(BaseModel):
    resource_id: int
    order_index: int = 0

class ModuleResourceRead(BaseModel):
    id: int
    module_id: int
    resource_id: int
    order_index: int
    resource: Optional[ResourceRead] = None

    class Config:
        from_attributes = True

class LearningModuleCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    order_index: int = 0
    resource_ids: List[int] = []

class LearningModuleRead(BaseModel):
    id: int
    path_id: int
    title: str
    description: Optional[str] = None
    order_index: int
    resources: List[ModuleResourceRead] = []
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LearningPathCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    level: str = "Beginner"
    estimated_hours: float = 10.0
    is_published: bool = True
    modules: List[LearningModuleCreate] = []

class LearningPathUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    estimated_hours: Optional[float] = None
    is_published: Optional[bool] = None

class LearningPathRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    level: str
    estimated_hours: float
    is_published: bool
    author_id: Optional[int] = None
    modules_count: int = 0
    user_progress_percentage: float = 0.0
    user_status: str = "NOT_STARTED"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LearningPathDetailRead(LearningPathRead):
    modules: List[LearningModuleRead] = []
