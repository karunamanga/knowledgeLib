from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.modules.audit.repository import AuditRepository
from app.modules.audit.models import AuditLog
from app.shared.enums import AuditAction

class AuditService:
    def __init__(self, db: Session):
        self.repository = AuditRepository(db)

    def log_event(self, action: AuditAction, user_id: Optional[int] = None, user_email: Optional[str] = None,
                  entity_type: Optional[str] = None, entity_id: Optional[str] = None,
                  details: Optional[str] = None, ip_address: Optional[str] = None) -> AuditLog:
        return self.repository.create(
            action=action,
            user_id=user_id,
            user_email=user_email,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )

    def get_logs(self, action: Optional[AuditAction] = None, user_id: Optional[int] = None,
                 offset: int = 0, limit: int = 20) -> Tuple[List[AuditLog], int]:
        return self.repository.list_logs(action=action, user_id=user_id, offset=offset, limit=limit)
