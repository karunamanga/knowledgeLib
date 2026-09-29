from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.modules.knowledge.schemas import ResourceRead, AuthorRead

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    problem_statement: Optional[str] = None
    description: str = Field(..., min_length=5)
    technologies: Optional[str] = None  # Comma-separated
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    architecture_summary: Optional[str] = None
    resource_ids: List[int] = []

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    problem_statement: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[str] = None
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    architecture_summary: Optional[str] = None
    resource_ids: Optional[List[int]] = None

class ProjectRead(BaseModel):
    id: int
    name: str
    slug: str
    problem_statement: Optional[str] = None
    description: str
    technologies: Optional[str] = None
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    architecture_summary: Optional[str] = None
    created_by: Optional[int] = None
    creator: Optional[AuthorRead] = None
    resources: List[ResourceRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
