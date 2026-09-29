from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode, SubmissionStatus
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.submissions.schemas import SubmissionRead, SubmissionCreate, SubmissionUpdate
from app.modules.submissions.service import SubmissionService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("", response_model=APIResponse[PaginatedResponse[SubmissionRead]])
def list_submissions(
    status: Optional[SubmissionStatus] = Query(None),
    search: Optional[str] = Query(None),
    all_users: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    user_filter = None if all_users else current_user.id
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_submissions(
        user_id=user_filter,
        status=status,
        search=search,
        offset=params.offset,
        limit=params.limit
    )
    paginated = PaginatedResponse.create(
        items=[SubmissionRead.model_validate(s) for s in items],
        total=total,
        params=params
    )
    return APIResponse(data=paginated)

@router.get("/{submission_id}", response_model=APIResponse[SubmissionRead])
def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    sub = service.get_submission_by_id(submission_id)
    return APIResponse(data=SubmissionRead.model_validate(sub))

@router.post("", response_model=APIResponse[SubmissionRead])
def create_submission(
    payload: SubmissionCreate,
    as_submitted: bool = Query(True, description="Immediately submit for review or save as draft"),
    current_user: User = Depends(require_permission(PermissionCode.SUBMISSION_CREATE)),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    sub = service.create_submission(payload, user=current_user, as_submitted=as_submitted)
    return APIResponse(message="Submission created", data=SubmissionRead.model_validate(sub))

@router.post("/{submission_id}/submit", response_model=APIResponse[SubmissionRead])
def submit_draft_or_resubmit(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    sub = service.submit_draft(submission_id, user=current_user)
    return APIResponse(message="Submitted for review", data=SubmissionRead.model_validate(sub))

@router.delete("/{submission_id}", response_model=APIResponse[bool])
def delete_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    service.delete_submission(submission_id, user=current_user)
    return APIResponse(message="Submission deleted", data=True)
