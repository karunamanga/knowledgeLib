from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.shared.enums import PermissionCode, SubmissionStatus
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.submissions.schemas import SubmissionRead, SubmissionReviewRequest
from app.modules.submissions.service import SubmissionService

router = APIRouter(prefix="/reviews", tags=["Mentor Reviews"])

@router.get("/pending", response_model=APIResponse[PaginatedResponse[SubmissionRead]])
def list_pending_reviews(
    status: Optional[SubmissionStatus] = Query(None, description="Filter by status (default all non-drafts)"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(PermissionCode.SUBMISSION_REVIEW)),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_submissions(
        user_id=None,
        status=status,
        search=search,
        offset=params.offset,
        limit=params.limit
    )
    # Exclude drafts from mentor queue unless specific status requested
    if status is None:
        items = [s for s in items if s.status != SubmissionStatus.DRAFT]
        total = len(items)

    paginated = PaginatedResponse.create(
        items=[SubmissionRead.model_validate(s) for s in items],
        total=total,
        params=params
    )
    return APIResponse(data=paginated)

@router.post("/{submission_id}/review", response_model=APIResponse[SubmissionRead])
def review_submission(
    submission_id: int,
    payload: SubmissionReviewRequest,
    current_user: User = Depends(require_permission(PermissionCode.SUBMISSION_REVIEW)),
    db: Session = Depends(get_db)
):
    service = SubmissionService(db)
    sub = service.review_submission(submission_id=submission_id, payload=payload, reviewer=current_user)
    return APIResponse(message=f"Submission {payload.status.value.lower()} successfully", data=SubmissionRead.model_validate(sub))
