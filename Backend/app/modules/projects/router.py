from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.projects.schemas import ProjectRead, ProjectCreate, ProjectUpdate
from app.modules.projects.service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=APIResponse[PaginatedResponse[ProjectRead]])
def list_projects(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ProjectService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_projects(search=search, offset=params.offset, limit=params.limit)
    paginated = PaginatedResponse.create(
        items=[ProjectRead.model_validate(p) for p in items],
        total=total,
        params=params
    )
    return APIResponse(data=paginated)

@router.get("/{project_id}", response_model=APIResponse[ProjectRead])
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ProjectService(db)
    proj = service.get_project_by_id(project_id)
    return APIResponse(data=ProjectRead.model_validate(proj))

@router.post("", response_model=APIResponse[ProjectRead])
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(require_permission(PermissionCode.PROJECT_MANAGE)),
    db: Session = Depends(get_db)
):
    service = ProjectService(db)
    proj = service.create_project(payload, creator=current_user)
    return APIResponse(message="Project created successfully", data=ProjectRead.model_validate(proj))

@router.put("/{project_id}", response_model=APIResponse[ProjectRead])
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(require_permission(PermissionCode.PROJECT_MANAGE)),
    db: Session = Depends(get_db)
):
    service = ProjectService(db)
    proj = service.update_project(project_id, payload, actor=current_user)
    return APIResponse(message="Project updated successfully", data=ProjectRead.model_validate(proj))

@router.delete("/{project_id}", response_model=APIResponse[bool])
def delete_project(
    project_id: int,
    current_user: User = Depends(require_permission(PermissionCode.PROJECT_MANAGE)),
    db: Session = Depends(get_db)
):
    service = ProjectService(db)
    service.delete_project(project_id, actor=current_user)
    return APIResponse(message="Project deleted successfully", data=True)
