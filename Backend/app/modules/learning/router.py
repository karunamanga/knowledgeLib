from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.learning.schemas import LearningEntryRead, LearningEntryCreate, LearningEntryUpdate
from app.modules.learning.service import LearningService

router = APIRouter(prefix="/learning", tags=["Daily Learning Journal"])

@router.get("", response_model=APIResponse[PaginatedResponse[LearningEntryRead]])
def list_learning_entries(
    user_id: Optional[int] = Query(None, description="Filter by user (default current user)"),
    all_users: bool = Query(False, description="List all users entries if true"),
    search: Optional[str] = Query(None, description="Search term"),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningService(db)
    target_user_id = None if all_users else (user_id or current_user.id)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_entries(
        user_id=target_user_id,
        search=search,
        from_date=from_date,
        to_date=to_date,
        offset=params.offset,
        limit=params.limit
    )
    paginated = PaginatedResponse.create(
        items=[LearningEntryRead.model_validate(e) for e in items],
        total=total,
        params=params
    )
    return APIResponse(data=paginated)

@router.get("/{entry_id}", response_model=APIResponse[LearningEntryRead])
def get_learning_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningService(db)
    entry = service.get_entry_by_id(entry_id)
    return APIResponse(data=LearningEntryRead.model_validate(entry))

@router.post("", response_model=APIResponse[LearningEntryRead])
def create_learning_entry(
    payload: LearningEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningService(db)
    entry = service.create_entry(payload, user=current_user)
    return APIResponse(message="Learning entry recorded", data=LearningEntryRead.model_validate(entry))

@router.put("/{entry_id}", response_model=APIResponse[LearningEntryRead])
def update_learning_entry(
    entry_id: int,
    payload: LearningEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningService(db)
    entry = service.update_entry(entry_id, payload, actor=current_user)
    return APIResponse(message="Learning entry updated", data=LearningEntryRead.model_validate(entry))

@router.delete("/{entry_id}", response_model=APIResponse[bool])
def delete_learning_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = LearningService(db)
    service.delete_entry(entry_id, actor=current_user)
    return APIResponse(message="Learning entry deleted", data=True)
