from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.submissions.models import Submission, SubmissionHistory
from app.shared.enums import SubmissionStatus

class SubmissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, submission_id: int) -> Optional[Submission]:
        return self.db.query(Submission).filter(Submission.id == submission_id).first()

    def list_submissions(
        self,
        user_id: Optional[int] = None,
        reviewer_id: Optional[int] = None,
        status: Optional[SubmissionStatus] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[Submission], int]:
        query = self.db.query(Submission)
        if user_id:
            query = query.filter(Submission.user_id == user_id)
        if reviewer_id:
            query = query.filter(Submission.reviewer_id == reviewer_id)
        if status:
            query = query.filter(Submission.status == status)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(Submission.title.ilike(pattern), Submission.description.ilike(pattern)))

        total = query.count()
        items = query.order_by(Submission.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def create(self, sub: Submission) -> Submission:
        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return sub

    def update(self, sub: Submission) -> Submission:
        self.db.commit()
        self.db.refresh(sub)
        return sub

    def delete(self, sub: Submission) -> bool:
        self.db.delete(sub)
        self.db.commit()
        return True

    def add_history(self, submission_id: int, status: SubmissionStatus, actor_id: Optional[int] = None, comments: Optional[str] = None) -> SubmissionHistory:
        history = SubmissionHistory(
            submission_id=submission_id,
            status=status,
            actor_id=actor_id,
            comments=comments
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        return history
