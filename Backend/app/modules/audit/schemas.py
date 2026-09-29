from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.shared.enums import AuditAction

class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: AuditAction
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
