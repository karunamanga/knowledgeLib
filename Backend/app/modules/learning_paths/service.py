from datetime import datetime
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.modules.learning_paths.models import LearningPath, LearningModule, LearningModuleResource, UserPathProgress, UserModuleProgress
from app.modules.learning_paths.repository import LearningPathRepository
from app.modules.learning_paths.schemas import LearningPathCreate, LearningPathUpdate, LearningModuleCreate
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction

class LearningPathService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = LearningPathRepository(db)
        self.audit_service = AuditService(db)

    def list_paths(self, search: Optional[str] = None, level: Optional[str] = None, user_id: Optional[int] = None, offset: int = 0, limit: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        items, total = self.repository.list_paths(search=search, level=level, offset=offset, limit=limit)
        results = []
        for path in items:
            progress_pct = 0.0
            status = "NOT_STARTED"
            if user_id:
                prog = self.repository.get_user_path_progress(user_id=user_id, path_id=path.id)
                if prog:
                    progress_pct = prog.progress_percentage
                    status = prog.status

            results.append({
                "id": path.id,
                "title": path.title,
                "description": path.description,
                "level": path.level,
                "estimated_hours": path.estimated_hours,
                "is_published": path.is_published,
                "author_id": path.author_id,
                "modules_count": len(path.modules),
                "user_progress_percentage": progress_pct,
                "user_status": status,
                "created_at": path.created_at,
                "updated_at": path.updated_at
            })
        return results, total

    def get_path_detail(self, path_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
        path = self.repository.get_by_id(path_id)
        if not path:
            raise EntityNotFoundException(f"Learning path with ID {path_id} not found")

        modules_data = []
        completed_count = 0
        total_modules = len(path.modules)

        for mod in path.modules:
            is_comp = False
            if user_id:
                m_prog = self.repository.get_user_module_progress(user_id=user_id, module_id=mod.id)
                if m_prog and m_prog.is_completed:
                    is_comp = True
                    completed_count += 1

            resources_list = []
            for r in mod.resources:
                res_data = None
                if r.resource:
                    res_data = {
                        "id": r.resource.id,
                        "title": r.resource.title,
                        "description": r.resource.description,
                        "resource_type": r.resource.resource_type,
                        "category_id": r.resource.category_id,
                        "author_id": r.resource.author_id,
                        "author": {
                            "id": r.resource.author.id,
                            "full_name": r.resource.author.full_name,
                            "email": r.resource.author.email,
                            "avatar_url": r.resource.author.avatar_url,
                            "designation": r.resource.author.designation
                        } if r.resource.author else None,
                        "storage_key": r.resource.storage_key,
                        "original_filename": r.resource.original_filename,
                        "external_url": r.resource.external_url,
                        "file_size": r.resource.file_size,
                        "content_type": r.resource.content_type,
                        "view_count": r.resource.view_count,
                        "download_count": r.resource.download_count,
                        "tags": [{"id": t.id, "name": t.name, "slug": t.slug, "created_at": t.created_at} for t in r.resource.tags],
                        "created_at": r.resource.created_at,
                        "updated_at": r.resource.updated_at
                    }

                resources_list.append({
                    "id": r.id,
                    "module_id": r.module_id,
                    "resource_id": r.resource_id,
                    "order_index": r.order_index,
                    "resource": res_data
                })

            modules_data.append({
                "id": mod.id,
                "path_id": mod.path_id,
                "title": mod.title,
                "description": mod.description,
                "order_index": mod.order_index,
                "resources": resources_list,
                "is_completed": is_comp,
                "created_at": mod.created_at,
                "updated_at": mod.updated_at
            })

        progress_pct = round((completed_count / total_modules * 100), 1) if total_modules > 0 else 0.0
        status = "NOT_STARTED"
        if progress_pct >= 100.0:
            status = "COMPLETED"
        elif progress_pct > 0.0:
            status = "IN_PROGRESS"

        return {
            "id": path.id,
            "title": path.title,
            "description": path.description,
            "level": path.level,
            "estimated_hours": path.estimated_hours,
            "is_published": path.is_published,
            "author_id": path.author_id,
            "modules_count": total_modules,
            "user_progress_percentage": progress_pct,
            "user_status": status,
            "modules": modules_data,
            "created_at": path.created_at,
            "updated_at": path.updated_at
        }

    def create_path(self, payload: LearningPathCreate, author: User) -> LearningPath:
        path = LearningPath(
            title=payload.title,
            description=payload.description,
            level=payload.level,
            estimated_hours=payload.estimated_hours,
            is_published=payload.is_published,
            author_id=author.id
        )
        created_path = self.repository.create(path)

        for i, m in enumerate(payload.modules):
            module = LearningModule(
                path_id=created_path.id,
                title=m.title,
                description=m.description,
                order_index=m.order_index or i
            )
            created_mod = self.repository.create_module(module)
            for j, res_id in enumerate(m.resource_ids):
                mr = LearningModuleResource(
                    module_id=created_mod.id,
                    resource_id=res_id,
                    order_index=j
                )
                self.db.add(mr)
        self.db.commit()
        self.db.refresh(created_path)
        return created_path

    def update_path(self, path_id: int, payload: LearningPathUpdate, actor: User) -> LearningPath:
        path = self.repository.get_by_id(path_id)
        if not path:
            raise EntityNotFoundException(f"Learning path {path_id} not found")

        if payload.title is not None:
            path.title = payload.title
        if payload.description is not None:
            path.description = payload.description
        if payload.level is not None:
            path.level = payload.level
        if payload.estimated_hours is not None:
            path.estimated_hours = payload.estimated_hours
        if payload.is_published is not None:
            path.is_published = payload.is_published

        return self.repository.update(path)

    def delete_path(self, path_id: int, actor: User) -> bool:
        path = self.repository.get_by_id(path_id)
        if not path:
            raise EntityNotFoundException(f"Learning path {path_id} not found")
        return self.repository.delete(path)

    def toggle_module_progress(self, module_id: int, user: User) -> Dict[str, Any]:
        module = self.repository.get_module_by_id(module_id)
        if not module:
            raise EntityNotFoundException(f"Module {module_id} not found")

        m_prog = self.repository.get_user_module_progress(user_id=user.id, module_id=module_id)
        if not m_prog:
            m_prog = UserModuleProgress(user_id=user.id, module_id=module_id, is_completed=True, completed_at=datetime.utcnow())
        else:
            m_prog.is_completed = not m_prog.is_completed
            m_prog.completed_at = datetime.utcnow() if m_prog.is_completed else None

        self.repository.save_user_module_progress(m_prog)

        # Recalculate Path Progress
        path = module.path
        total_modules = len(path.modules)
        completed_count = 0
        for m in path.modules:
            p = self.repository.get_user_module_progress(user_id=user.id, module_id=m.id)
            if p and p.is_completed:
                completed_count += 1

        pct = round((completed_count / total_modules * 100), 1) if total_modules > 0 else 0.0
        status = "COMPLETED" if pct >= 100.0 else ("IN_PROGRESS" if pct > 0 else "NOT_STARTED")

        path_prog = self.repository.get_user_path_progress(user_id=user.id, path_id=path.id)
        if not path_prog:
            path_prog = UserPathProgress(
                user_id=user.id,
                path_id=path.id,
                progress_percentage=pct,
                status=status,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow() if status == "COMPLETED" else None
            )
        else:
            path_prog.progress_percentage = pct
            path_prog.status = status
            if status == "COMPLETED" and not path_prog.completed_at:
                path_prog.completed_at = datetime.utcnow()
        
        self.repository.save_user_path_progress(path_prog)

        return {
            "module_id": module_id,
            "is_completed": m_prog.is_completed,
            "path_progress_percentage": pct,
            "path_status": status
        }
