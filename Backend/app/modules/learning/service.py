from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException
from app.modules.learning.models import LearningEntry
from app.modules.learning.repository import LearningRepository
from app.modules.learning.schemas import LearningEntryCreate, LearningEntryUpdate
from app.modules.knowledge.models import Resource
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction, RoleName

class LearningService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = LearningRepository(db)
        self.audit_service = AuditService(db)

    def list_entries(
        self,
        user_id: Optional[int] = None,
        search: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[LearningEntry], int]:
        return self.repository.list_entries(
            user_id=user_id,
            search=search,
            from_date=from_date,
            to_date=to_date,
            offset=offset,
            limit=limit
        )

    def get_entry_by_id(self, entry_id: int) -> LearningEntry:
        entry = self.repository.get_by_id(entry_id)
        if not entry:
            raise EntityNotFoundException(f"Learning entry {entry_id} not found")
        return entry

    def create_entry(self, payload: LearningEntryCreate, user: User) -> LearningEntry:
        resources = []
        if payload.resource_ids:
            resources = self.db.query(Resource).filter(Resource.id.in_(payload.resource_ids)).all()

        entry = LearningEntry(
            user_id=user.id,
            title=payload.title,
            description=payload.description,
            work_completed=payload.work_completed,
            learning_date=payload.learning_date,
            status=payload.status,
            resources=resources
        )
        created = self.repository.create(entry)

        self.audit_service.log_event(
            action=AuditAction.LEARNING_CREATED,
            user_id=user.id,
            user_email=user.email,
            entity_type="LEARNING_ENTRY",
            entity_id=str(created.id),
            details=f"Created learning entry '{created.title}'"
        )
        return created

    def update_entry(self, entry_id: int, payload: LearningEntryUpdate, actor: User) -> LearningEntry:
        entry = self.get_entry_by_id(entry_id)
        user_roles = {r.name for r in actor.roles}
        if entry.user_id != actor.id and RoleName.ADMIN.value not in user_roles:
            raise PermissionDeniedException("You can only edit your own learning entries")

        if payload.title is not None:
            entry.title = payload.title
        if payload.description is not None:
            entry.description = payload.description
        if payload.work_completed is not None:
            entry.work_completed = payload.work_completed
        if payload.learning_date is not None:
            entry.learning_date = payload.learning_date
        if payload.status is not None:
            entry.status = payload.status
        if payload.resource_ids is not None:
            resources = self.db.query(Resource).filter(Resource.id.in_(payload.resource_ids)).all()
            entry.resources = resources

        updated = self.repository.update(entry)
        return updated

    def delete_entry(self, entry_id: int, actor: User) -> bool:
        entry = self.get_entry_by_id(entry_id)
        user_roles = {r.name for r in actor.roles}
        if entry.user_id != actor.id and RoleName.ADMIN.value not in user_roles:
            raise PermissionDeniedException("You can only delete your own learning entries")

        return self.repository.delete(entry)
