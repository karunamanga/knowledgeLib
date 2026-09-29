from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.modules.audit.models import AuditLog
from app.shared.enums import AuditAction

class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, action: AuditAction, user_id: Optional[int] = None, user_email: Optional[str] = None,
               entity_type: Optional[str] = None, entity_id: Optional[str] = None,
               details: Optional[str] = None, ip_address: Optional[str] = None) -> AuditLog:
        log = AuditLog(
            action=action,
            user_id=user_id,
            user_email=user_email,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            details=details,
            ip_address=ip_address
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_logs(self, action: Optional[AuditAction] = None, user_id: Optional[int] = None,
                  offset: int = 0, limit: int = 20) -> Tuple[List[AuditLog], int]:
        query = self.db.query(AuditLog)
        if action:
            query = query.filter(AuditLog.action == action)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        total = query.count()
        items = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        return items, total
