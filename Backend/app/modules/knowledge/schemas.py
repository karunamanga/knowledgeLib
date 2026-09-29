from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.shared.enums import ResourceType
from app.modules.categories.schemas import CategoryRead, TagRead

class AuthorRead(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    designation: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    resource_type: ResourceType = ResourceType.DOCUMENT
    category_id: Optional[int] = None
    external_url: Optional[str] = None
    tags: List[str] = []

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resource_type: Optional[ResourceType] = None
    category_id: Optional[int] = None
    external_url: Optional[str] = None
    tags: Optional[List[str]] = None

class ResourceRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    resource_type: ResourceType
    category_id: Optional[int] = None
    category: Optional[CategoryRead] = None
    author_id: int
    author: AuthorRead
    storage_key: Optional[str] = None
    original_filename: Optional[str] = None
    external_url: Optional[str] = None
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    view_count: int = 0
    download_count: int = 0
    tags: List[TagRead] = []
    download_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
