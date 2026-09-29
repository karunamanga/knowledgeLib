from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.learning_paths.models import LearningPath, LearningModule, LearningModuleResource, UserPathProgress, UserModuleProgress

class LearningPathRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, path_id: int) -> Optional[LearningPath]:
        return self.db.query(LearningPath).filter(LearningPath.id == path_id).first()

    def list_paths(self, search: Optional[str] = None, level: Optional[str] = None, offset: int = 0, limit: int = 20) -> Tuple[List[LearningPath], int]:
        query = self.db.query(LearningPath)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(LearningPath.title.ilike(pattern), LearningPath.description.ilike(pattern)))
        if level:
            query = query.filter(LearningPath.level == level)
        
        total = query.count()
        items = query.order_by(LearningPath.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def create(self, path: LearningPath) -> LearningPath:
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return path

    def update(self, path: LearningPath) -> LearningPath:
        self.db.commit()
        self.db.refresh(path)
        return path

    def delete(self, path: LearningPath) -> bool:
        self.db.delete(path)
        self.db.commit()
        return True

    def get_module_by_id(self, module_id: int) -> Optional[LearningModule]:
        return self.db.query(LearningModule).filter(LearningModule.id == module_id).first()

    def create_module(self, module: LearningModule) -> LearningModule:
        self.db.add(module)
        self.db.commit()
        self.db.refresh(module)
        return module

    def delete_module(self, module: LearningModule) -> bool:
        self.db.delete(module)
        self.db.commit()
        return True

    def get_user_path_progress(self, user_id: int, path_id: int) -> Optional[UserPathProgress]:
        return self.db.query(UserPathProgress).filter(
            UserPathProgress.user_id == user_id,
            UserPathProgress.path_id == path_id
        ).first()

    def get_user_module_progress(self, user_id: int, module_id: int) -> Optional[UserModuleProgress]:
        return self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_id == user_id,
            UserModuleProgress.module_id == module_id
        ).first()

    def save_user_module_progress(self, progress: UserModuleProgress) -> UserModuleProgress:
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def save_user_path_progress(self, progress: UserPathProgress) -> UserPathProgress:
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress
