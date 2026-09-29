from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.dashboard.schemas import DashboardStatsRead
from app.modules.dashboard.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=APIResponse[DashboardStatsRead])
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    summary = service.get_summary(current_user)
    return APIResponse(data=DashboardStatsRead(**summary))
