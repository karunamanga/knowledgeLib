from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.categories.schemas import CategoryRead, CategoryCreate, CategoryUpdate, TagRead, TagCreate
from app.modules.categories.service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories & Tags"])

@router.get("", response_model=APIResponse[List[CategoryRead]])
def list_categories(db: Session = Depends(get_db)):
    service = CategoryService(db)
    items = service.list_categories()
    return APIResponse(data=[CategoryRead.model_validate(c) for c in items])

@router.post("", response_model=APIResponse[CategoryRead])
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_permission(PermissionCode.CATEGORY_MANAGE)),
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    cat = service.create_category(payload, actor=current_user)
    return APIResponse(message="Category created successfully", data=CategoryRead.model_validate(cat))

@router.put("/{category_id}", response_model=APIResponse[CategoryRead])
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    current_user: User = Depends(require_permission(PermissionCode.CATEGORY_MANAGE)),
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    cat = service.update_category(category_id, payload, actor=current_user)
    return APIResponse(message="Category updated successfully", data=CategoryRead.model_validate(cat))

@router.delete("/{category_id}", response_model=APIResponse[bool])
def delete_category(
    category_id: int,
    current_user: User = Depends(require_permission(PermissionCode.CATEGORY_MANAGE)),
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    service.delete_category(category_id, actor=current_user)
    return APIResponse(message="Category deleted successfully", data=True)

@router.get("/tags", response_model=APIResponse[List[TagRead]])
def list_tags(db: Session = Depends(get_db)):
    service = CategoryService(db)
    tags = service.list_tags()
    return APIResponse(data=[TagRead.model_validate(t) for t in tags])

@router.post("/tags", response_model=APIResponse[TagRead])
def create_tag(payload: TagCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = CategoryService(db)
    tag = service.get_or_create_tag(payload.name)
    return APIResponse(message="Tag created successfully", data=TagRead.model_validate(tag))
