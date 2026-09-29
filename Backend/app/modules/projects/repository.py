from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.projects.models import Project
from app.modules.categories.repository import slugify

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def get_by_slug(self, slug: str) -> Optional[Project]:
        return self.db.query(Project).filter(Project.slug == slug).first()

    def list_projects(self, search: Optional[str] = None, offset: int = 0, limit: int = 20) -> Tuple[List[Project], int]:
        query = self.db.query(Project)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(Project.name.ilike(pattern), Project.description.ilike(pattern), Project.technologies.ilike(pattern)))

        total = query.count()
        items = query.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project) -> Project:
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> bool:
        self.db.delete(project)
        self.db.commit()
        return True
