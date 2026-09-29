from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.categories.router import router as categories_router
from app.modules.knowledge.router import router as knowledge_router
from app.modules.learning_paths.router import router as learning_paths_router
from app.modules.learning.router import router as learning_router
from app.modules.submissions.router import router as submissions_router
from app.modules.reviews.router import router as reviews_router
from app.modules.projects.router import router as projects_router
from app.modules.audit.router import router as audit_router
from app.modules.dashboard.router import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(categories_router)
api_router.include_router(knowledge_router)
api_router.include_router(learning_paths_router)
api_router.include_router(learning_router)
api_router.include_router(submissions_router)
api_router.include_router(reviews_router)
api_router.include_router(projects_router)
api_router.include_router(audit_router)
api_router.include_router(dashboard_router)
