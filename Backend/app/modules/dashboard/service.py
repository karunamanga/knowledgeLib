from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.modules.users.models import User
from app.modules.knowledge.models import Resource
from app.modules.learning.models import LearningEntry
from app.modules.submissions.models import Submission
from app.modules.learning_paths.models import LearningPath, UserPathProgress
from app.modules.learning_paths.service import LearningPathService
from app.shared.enums import SubmissionStatus, LearningStatus, RoleName, PermissionCode

class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.path_service = LearningPathService(db)

    def get_summary(self, user: User) -> Dict[str, Any]:
        hour = datetime.utcnow().hour
        greeting = "Good morning" if 5 <= hour < 12 else ("Good afternoon" if 12 <= hour < 18 else "Good evening")

        total_entries = self.db.query(LearningEntry).filter(LearningEntry.user_id == user.id).count()
        completed_entries = self.db.query(LearningEntry).filter(
            LearningEntry.user_id == user.id,
            LearningEntry.status == LearningStatus.COMPLETED
        ).count()

        pending_subs = self.db.query(Submission).filter(
            Submission.user_id == user.id,
            Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW, SubmissionStatus.RESUBMITTED])
        ).count()

        approved_subs = self.db.query(Submission).filter(
            Submission.user_id == user.id,
            Submission.status == SubmissionStatus.APPROVED
        ).count()

        total_resources = self.db.query(Resource).count()
        total_paths = self.db.query(LearningPath).filter(LearningPath.is_published == True).count()

        # Overall learning progress calculation
        path_progresses = self.db.query(UserPathProgress).filter(UserPathProgress.user_id == user.id).all()
        avg_progress = 0.0
        if path_progresses:
            avg_progress = round(sum(p.progress_percentage for p in path_progresses) / len(path_progresses), 1)

        # Recent resources
        recent_resources_models = self.db.query(Resource).order_by(Resource.created_at.desc()).limit(6).all()
        recent_resources = []
        for r in recent_resources_models:
            recent_resources.append({
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "resource_type": r.resource_type,
                "category_id": r.category_id,
                "category": {
                    "id": r.category.id,
                    "name": r.category.name,
                    "slug": r.category.slug,
                    "description": r.category.description,
                    "icon": r.category.icon,
                    "color": r.category.color,
                    "created_at": r.category.created_at,
                    "updated_at": r.category.updated_at
                } if r.category else None,
                "author_id": r.author_id,
                "author": {
                    "id": r.author.id,
                    "full_name": r.author.full_name,
                    "email": r.author.email,
                    "avatar_url": r.author.avatar_url,
                    "designation": r.author.designation
                } if r.author else None,
                "storage_key": r.storage_key,
                "original_filename": r.original_filename,
                "external_url": r.external_url,
                "file_size": r.file_size,
                "content_type": r.content_type,
                "view_count": r.view_count,
                "download_count": r.download_count,
                "tags": [{"id": t.id, "name": t.name, "slug": t.slug, "created_at": t.created_at} for t in r.tags],
                "download_url": f"/api/v1/knowledge/files/{r.storage_key}" if r.storage_key else None,
                "created_at": r.created_at,
                "updated_at": r.updated_at
            })

        # Active paths
        paths_data, _ = self.path_service.list_paths(user_id=user.id, limit=4)

        # Recent entries
        recent_entries_models = self.db.query(LearningEntry).filter(LearningEntry.user_id == user.id).order_by(LearningEntry.learning_date.desc(), LearningEntry.id.desc()).limit(5).all()

        # Mentor pending review count
        user_perms = {p.code for r in user.roles for p in r.permissions}
        user_roles_set = {r.name for r in user.roles}
        is_mentor_or_admin = RoleName.ADMIN.value in user_roles_set or PermissionCode.SUBMISSION_REVIEW.value in user_perms
        pending_reviews_count = 0
        if is_mentor_or_admin:
            pending_reviews_count = self.db.query(Submission).filter(
                Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW, SubmissionStatus.RESUBMITTED])
            ).count()

        return {
            "user_name": user.full_name,
            "greeting": greeting,
            "learning_progress_pct": avg_progress,
            "total_learning_entries": total_entries,
            "completed_learning_entries": completed_entries,
            "pending_submissions": pending_subs,
            "approved_submissions": approved_subs,
            "resources_explored": total_entries + completed_entries,
            "total_org_resources": total_resources,
            "total_learning_paths": total_paths,
            "recent_resources": recent_resources,
            "active_paths": paths_data,
            "recent_entries": [
                {
                    "id": e.id,
                    "user_id": e.user_id,
                    "user": {
                        "id": e.user.id,
                        "full_name": e.user.full_name,
                        "email": e.user.email,
                        "avatar_url": e.user.avatar_url,
                        "designation": e.user.designation
                    } if e.user else None,
                    "title": e.title,
                    "description": e.description,
                    "work_completed": e.work_completed,
                    "learning_date": e.learning_date,
                    "status": e.status,
                    "resources": [],
                    "created_at": e.created_at,
                    "updated_at": e.updated_at
                }
                for e in recent_entries_models
            ],
            "pending_reviews_count": pending_reviews_count
        }
