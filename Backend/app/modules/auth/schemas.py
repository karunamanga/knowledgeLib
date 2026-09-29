from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6)
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    auth_user_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PermissionRead(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionRead] = []

    class Config:
        from_attributes = True

class UserProfileRead(BaseModel):
    id: int
    email: str
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[datetime] = None
    avatar_url: Optional[str] = None
    is_active: bool
    roles: List[RoleRead] = []
    permissions: List[str] = []

    class Config:
        from_attributes = True
