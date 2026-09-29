from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.users.schemas import (
    UserRead, UserCreate, UserUpdate, UserRolesUpdate, 
    RoleSchema, PermissionSchema, UserStatsRead
)
from app.modules.users.service import UserService

from app.integrations.storage.factory import get_storage_provider

router = APIRouter(prefix="/users", tags=["Users & RBAC"])

@router.get("/me", response_model=APIResponse[UserRead])
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return APIResponse(data=UserRead.model_validate(current_user))

@router.patch("/me", response_model=APIResponse[UserRead])
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    user = service.update_user(current_user.id, payload, actor=current_user)
    return APIResponse(message="Profile updated successfully", data=UserRead.model_validate(user))

@router.post("/me/avatar", response_model=APIResponse[UserRead])
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    storage = get_storage_provider()
    content = await file.read()
    res = storage.upload(content, file.filename or "avatar.png", file.content_type or "image/png")
    avatar_url = storage.generate_url(res["storage_key"])
    
    service = UserService(db)
    user = service.update_user(current_user.id, UserUpdate(avatar_url=avatar_url), actor=current_user)
    return APIResponse(message="Avatar updated successfully", data=UserRead.model_validate(user))

@router.delete("/me/avatar", response_model=APIResponse[UserRead])
def remove_my_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    user = service.update_user(current_user.id, UserUpdate(avatar_url=""), actor=current_user)
    return APIResponse(message="Avatar removed successfully", data=UserRead.model_validate(user))

@router.get("", response_model=APIResponse[PaginatedResponse[UserRead]])
def list_users(
    search: Optional[str] = Query(None, description="Search by name, email or department"),
    role_id: Optional[int] = Query(None, description="Filter by role ID"),
    is_active: Optional[bool] = Query(None, description="Filter active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(PermissionCode.USER_READ)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_users(search=search, role_id=role_id, is_active=is_active, offset=params.offset, limit=params.limit)
    paginated = PaginatedResponse.create(items=[UserRead.model_validate(u) for u in items], total=total, params=params)
    return APIResponse(data=paginated)

@router.get("/roles/all", response_model=APIResponse[List[RoleSchema]])
def list_roles(
    current_user: User = Depends(require_permission(PermissionCode.USER_READ)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    roles = service.list_all_roles()
    return APIResponse(data=[RoleSchema.model_validate(r) for r in roles])

@router.get("/permissions/all", response_model=APIResponse[List[PermissionSchema]])
def list_permissions(
    current_user: User = Depends(require_permission(PermissionCode.USER_READ)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    perms = service.list_all_permissions()
    return APIResponse(data=[PermissionSchema.model_validate(p) for p in perms])

@router.get("/{user_id}", response_model=APIResponse[UserRead])
def get_user(
    user_id: int,
    current_user: User = Depends(require_permission(PermissionCode.USER_READ)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    user = service.get_user_by_id(user_id)
    return APIResponse(data=UserRead.model_validate(user))

@router.post("", response_model=APIResponse[UserRead])
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_permission(PermissionCode.USER_MANAGE)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    user = service.create_user(payload, actor=current_user)
    return APIResponse(message="User created successfully", data=UserRead.model_validate(user))

@router.put("/{user_id}", response_model=APIResponse[UserRead])
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Allow self update or admin/user:manage
    if current_user.id != user_id:
        require_permission(PermissionCode.USER_MANAGE)(current_user)
    
    service = UserService(db)
    user = service.update_user(user_id, payload, actor=current_user)
    return APIResponse(message="User updated successfully", data=UserRead.model_validate(user))

@router.put("/{user_id}/roles", response_model=APIResponse[UserRead])
def update_user_roles(
    user_id: int,
    payload: UserRolesUpdate,
    current_user: User = Depends(require_permission(PermissionCode.USER_MANAGE)),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    user = service.update_user_roles(user_id, payload.role_ids, actor=current_user)
    return APIResponse(message="User roles updated successfully", data=UserRead.model_validate(user))

@router.get("/{user_id}/stats", response_model=APIResponse[UserStatsRead])
def get_user_stats(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    stats = service.get_user_stats(user_id)
    return APIResponse(data=UserStatsRead(**stats))
