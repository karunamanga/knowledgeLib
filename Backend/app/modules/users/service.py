from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, ConflictException, PermissionDeniedException
from app.modules.users.models import User, Role
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.learning.models import LearningEntry
from app.modules.submissions.models import Submission
from app.modules.knowledge.models import Resource
from app.modules.learning_paths.models import UserPathProgress
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction, SubmissionStatus, LearningStatus

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = UserRepository(db)
        self.audit_service = AuditService(db)

    def list_users(self, search: Optional[str] = None, role_id: Optional[int] = None,
                   is_active: Optional[bool] = None, offset: int = 0, limit: int = 20) -> Tuple[List[User], int]:
        return self.repository.list_users(search=search, role_id=role_id, is_active=is_active, offset=offset, limit=limit)

    def get_user_by_id(self, user_id: int) -> User:
        user = self.repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException(f"User with ID {user_id} not found")
        return user

    def create_user(self, payload: UserCreate, actor: Optional[User] = None) -> User:
        existing = self.repository.get_by_email(payload.email)
        if existing:
            raise ConflictException(f"User with email '{payload.email}' already exists")

        roles = []
        if payload.role_ids:
            for rid in payload.role_ids:
                role = self.repository.get_role_by_id(rid)
                if role:
                    roles.append(role)
        else:
            # Default to EMPLOYEE
            default_role = self.repository.get_role_by_name("EMPLOYEE")
            if default_role:
                roles.append(default_role)

        new_user = User(
            email=payload.email.lower().strip(),
            hashed_password=get_password_hash(payload.password) if payload.password else "",
            full_name=payload.full_name,
            employee_id=payload.employee_id,
            auth_user_id=payload.auth_user_id,
            designation=payload.designation,
            department=payload.department,
            joining_date=datetime.utcnow(),
            is_active=True,
            roles=roles
        )
        user = self.repository.create_user(new_user)

        self.audit_service.log_event(
            action=AuditAction.USER_CREATED,
            user_id=actor.id if actor else None,
            user_email=actor.email if actor else None,
            entity_type="USER",
            entity_id=str(user.id),
            details=f"Created user {user.email} with roles {[r.name for r in user.roles]}"
        )
        return user

    def update_user(self, user_id: int, payload: UserUpdate, actor: Optional[User] = None) -> User:
        user = self.get_user_by_id(user_id)
        
        if payload.full_name is not None:
            user.full_name = payload.full_name
        if payload.employee_id is not None:
            user.employee_id = payload.employee_id
        if payload.designation is not None:
            user.designation = payload.designation
        if payload.department is not None:
            user.department = payload.department
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.password:
            user.hashed_password = get_password_hash(payload.password)

        updated = self.repository.update_user(user)
        return updated

    def update_user_roles(self, user_id: int, role_ids: List[int], actor: Optional[User] = None) -> User:
        user = self.get_user_by_id(user_id)
        roles = []
        for rid in role_ids:
            role = self.repository.get_role_by_id(rid)
            if role:
                roles.append(role)
        
        old_roles = [r.name for r in user.roles]
        user.roles = roles
        updated = self.repository.update_user(user)

        self.audit_service.log_event(
            action=AuditAction.USER_ROLE_CHANGED,
            user_id=actor.id if actor else None,
            user_email=actor.email if actor else None,
            entity_type="USER",
            entity_id=str(user.id),
            details=f"Changed roles for {user.email} from {old_roles} to {[r.name for r in user.roles]}"
        )
        return updated

    def get_user_stats(self, user_id: int) -> Dict[str, int]:
        learning_entries_count = self.db.query(LearningEntry).filter(LearningEntry.user_id == user_id).count()
        completed_learning_count = self.db.query(LearningEntry).filter(
            LearningEntry.user_id == user_id,
            LearningEntry.status == LearningStatus.COMPLETED
        ).count()
        submissions_count = self.db.query(Submission).filter(Submission.user_id == user_id).count()
        approved_submissions_count = self.db.query(Submission).filter(
            Submission.user_id == user_id,
            Submission.status == SubmissionStatus.APPROVED
        ).count()
        resources_uploaded_count = self.db.query(Resource).filter(Resource.author_id == user_id).count()
        paths_in_progress_count = self.db.query(UserPathProgress).filter(
            UserPathProgress.user_id == user_id,
            UserPathProgress.status == "IN_PROGRESS"
        ).count()

        return {
            "learning_entries_count": learning_entries_count,
            "completed_learning_count": completed_learning_count,
            "submissions_count": submissions_count,
            "approved_submissions_count": approved_submissions_count,
            "resources_uploaded_count": resources_uploaded_count,
            "paths_in_progress_count": paths_in_progress_count
        }

    def list_all_roles(self) -> List[Role]:
        return self.repository.list_roles()

    def list_all_permissions(self):
        return self.repository.list_permissions()
