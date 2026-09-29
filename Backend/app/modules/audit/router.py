from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.shared.enums import PermissionCode, AuditAction
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.audit.schemas import AuditLogRead
from app.modules.audit.service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=APIResponse[PaginatedResponse[AuditLogRead]])
def list_audit_logs(
    action: Optional[AuditAction] = Query(None),
    user_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(PermissionCode.AUDIT_READ)),
    db: Session = Depends(get_db)
):
    service = AuditService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.get_logs(action=action, user_id=user_id, offset=params.offset, limit=params.limit)
    paginated = PaginatedResponse.create(
        items=[AuditLogRead.model_validate(log) for log in items],
        total=total,
        params=params
    )
    return APIResponse(data=paginated)
