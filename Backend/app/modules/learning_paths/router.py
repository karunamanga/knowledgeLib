from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.learning_paths.schemas import (
    LearningPathRead, LearningPathDetailRead, LearningPathCreate, LearningPathUpdate
)
from app.modules.learning_paths.service import LearningPathService

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])

@router.get("", response_model=APIResponse[PaginatedResponse[LearningPathRead]])
def list_learning_paths(
    search: Optional[str] = Query(None, description="Search learning paths"),
    level: Optional[str] = Query(None, description="Level filter (Beginner, Intermediate, Advanced)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_paths(search=search, level=level, user_id=current_user.id, offset=params.offset, limit=params.limit)
    paginated = PaginatedResponse.create(items=[LearningPathRead(**p) for p in items], total=total, params=params)
    return APIResponse(data=paginated)

@router.get("/{path_id}", response_model=APIResponse[LearningPathDetailRead])
def get_learning_path_detail(
    path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    detail = service.get_path_detail(path_id, user_id=current_user.id)
    return APIResponse(data=detail)

@router.post("", response_model=APIResponse[LearningPathRead])
def create_learning_path(
    payload: LearningPathCreate,
    current_user: User = Depends(require_permission(PermissionCode.PATH_MANAGE)),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    path = service.create_path(payload, author=current_user)
    detail = service.get_path_detail(path.id, user_id=current_user.id)
    return APIResponse(message="Learning path created successfully", data=detail)

@router.put("/{path_id}", response_model=APIResponse[LearningPathRead])
def update_learning_path(
    path_id: int,
    payload: LearningPathUpdate,
    current_user: User = Depends(require_permission(PermissionCode.PATH_MANAGE)),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    path = service.update_path(path_id, payload, actor=current_user)
    detail = service.get_path_detail(path.id, user_id=current_user.id)
    return APIResponse(message="Learning path updated successfully", data=detail)

@router.delete("/{path_id}", response_model=APIResponse[bool])
def delete_learning_path(
    path_id: int,
    current_user: User = Depends(require_permission(PermissionCode.PATH_MANAGE)),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    service.delete_path(path_id, actor=current_user)
    return APIResponse(message="Learning path deleted successfully", data=True)

@router.post("/modules/{module_id}/toggle-progress", response_model=APIResponse[dict])
def toggle_module_progress(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningPathService(db)
    result = service.toggle_module_progress(module_id=module_id, user=current_user)
    return APIResponse(message="Progress updated", data=result)
