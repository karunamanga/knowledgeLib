from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, AppException
from app.modules.submissions.models import Submission
from app.modules.submissions.repository import SubmissionRepository
from app.modules.submissions.schemas import SubmissionCreate, SubmissionUpdate, SubmissionReviewRequest
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import SubmissionStatus, AuditAction, RoleName

class SubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SubmissionRepository(db)
        self.audit_service = AuditService(db)

    def list_submissions(
        self,
        user_id: Optional[int] = None,
        reviewer_id: Optional[int] = None,
        status: Optional[SubmissionStatus] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[Submission], int]:
        return self.repository.list_submissions(
            user_id=user_id,
            reviewer_id=reviewer_id,
            status=status,
            search=search,
            offset=offset,
            limit=limit
        )

    def get_submission_by_id(self, submission_id: int) -> Submission:
        sub = self.repository.get_by_id(submission_id)
        if not sub:
            raise EntityNotFoundException(f"Submission {submission_id} not found")
        return sub

    def create_submission(self, payload: SubmissionCreate, user: User, as_submitted: bool = False) -> Submission:
        initial_status = SubmissionStatus.SUBMITTED if as_submitted else SubmissionStatus.DRAFT
        submitted_at = datetime.utcnow() if as_submitted else None

        sub = Submission(
            user_id=user.id,
            learning_entry_id=payload.learning_entry_id,
            title=payload.title,
            description=payload.description,
            status=initial_status,
            submitted_at=submitted_at
        )
        created = self.repository.create(sub)
        self.repository.add_history(
            submission_id=created.id,
            status=initial_status,
            actor_id=user.id,
            comments="Initial submission created" if as_submitted else "Draft created"
        )

        self.audit_service.log_event(
            action=AuditAction.SUBMISSION_CREATED,
            user_id=user.id,
            user_email=user.email,
            entity_type="SUBMISSION",
            entity_id=str(created.id),
            details=f"Created submission '{created.title}' (Status: {initial_status})"
        )
        return created

    def submit_draft(self, submission_id: int, user: User) -> Submission:
        sub = self.get_submission_by_id(submission_id)
        if sub.user_id != user.id:
            raise PermissionDeniedException("You can only submit your own work")
        if sub.status not in [SubmissionStatus.DRAFT, SubmissionStatus.REJECTED]:
            raise AppException(f"Cannot submit when status is {sub.status}")

        new_status = SubmissionStatus.RESUBMITTED if sub.status == SubmissionStatus.REJECTED else SubmissionStatus.SUBMITTED
        sub.status = new_status
        sub.submitted_at = datetime.utcnow()
        updated = self.repository.update(sub)

        self.repository.add_history(
            submission_id=sub.id,
            status=new_status,
            actor_id=user.id,
            comments="Submission submitted for review"
        )
        return updated

    def review_submission(self, submission_id: int, payload: SubmissionReviewRequest, reviewer: User) -> Submission:
        sub = self.get_submission_by_id(submission_id)
        if sub.status not in [SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW, SubmissionStatus.RESUBMITTED]:
            raise AppException(f"Cannot review submission in status {sub.status}")

        sub.status = payload.status
        sub.reviewer_id = reviewer.id
        sub.feedback = payload.feedback
        sub.reviewed_at = datetime.utcnow()
        updated = self.repository.update(sub)

        self.repository.add_history(
            submission_id=sub.id,
            status=payload.status,
            actor_id=reviewer.id,
            comments=payload.feedback
        )

        self.audit_service.log_event(
            action=AuditAction.SUBMISSION_REVIEWED,
            user_id=reviewer.id,
            user_email=reviewer.email,
            entity_type="SUBMISSION",
            entity_id=str(sub.id),
            details=f"Reviewed submission '{sub.title}' -> {payload.status}"
        )
        return updated

    def delete_submission(self, submission_id: int, user: User) -> bool:
        sub = self.get_submission_by_id(submission_id)
        user_roles = {r.name for r in user.roles}
        if sub.user_id != user.id and RoleName.ADMIN.value not in user_roles:
            raise PermissionDeniedException("You can only delete your own draft submissions")
        if sub.status != SubmissionStatus.DRAFT and RoleName.ADMIN.value not in user_roles:
            raise AppException("Only draft submissions can be deleted")

        return self.repository.delete(sub)
