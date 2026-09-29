from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class PermissionSchema(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: Optional[str] = None
    full_name: str
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    auth_user_id: Optional[str] = None
    role_ids: List[int] = []

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserRolesUpdate(BaseModel):
    role_ids: List[int]

class UserRead(BaseModel):
    id: int
    auth_user_id: Optional[str] = None
    employee_id: Optional[str] = None
    email: str
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[datetime] = None
    avatar_url: Optional[str] = None
    is_active: bool
    roles: List[RoleSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserStatsRead(BaseModel):
    learning_entries_count: int
    completed_learning_count: int
    submissions_count: int
    approved_submissions_count: int
    resources_uploaded_count: int
    paths_in_progress_count: int
