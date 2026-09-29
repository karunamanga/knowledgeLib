from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, ConflictException
from app.modules.projects.models import Project
from app.modules.projects.repository import ProjectRepository
from app.modules.projects.schemas import ProjectCreate, ProjectUpdate
from app.modules.knowledge.models import Resource
from app.modules.categories.repository import slugify
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction

class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProjectRepository(db)
        self.audit_service = AuditService(db)

    def list_projects(self, search: Optional[str] = None, offset: int = 0, limit: int = 20) -> Tuple[List[Project], int]:
        return self.repository.list_projects(search=search, offset=offset, limit=limit)

    def get_project_by_id(self, project_id: int) -> Project:
        proj = self.repository.get_by_id(project_id)
        if not proj:
            raise EntityNotFoundException(f"Project {project_id} not found")
        return proj

    def create_project(self, payload: ProjectCreate, creator: User) -> Project:
        slug = slugify(payload.name)
        existing = self.repository.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

        resources = []
        if payload.resource_ids:
            resources = self.db.query(Resource).filter(Resource.id.in_(payload.resource_ids)).all()

        project = Project(
            name=payload.name,
            slug=slug,
            problem_statement=payload.problem_statement,
            description=payload.description,
            technologies=payload.technologies,
            repository_url=payload.repository_url,
            documentation_url=payload.documentation_url,
            architecture_summary=payload.architecture_summary,
            created_by=creator.id,
            resources=resources
        )
        created = self.repository.create(project)

        self.audit_service.log_event(
            action=AuditAction.PROJECT_CREATED,
            user_id=creator.id,
            user_email=creator.email,
            entity_type="PROJECT",
            entity_id=str(created.id),
            details=f"Created project '{created.name}'"
        )
        return created

    def update_project(self, project_id: int, payload: ProjectUpdate, actor: User) -> Project:
        project = self.get_project_by_id(project_id)
        if payload.name is not None:
            project.name = payload.name
        if payload.problem_statement is not None:
            project.problem_statement = payload.problem_statement
        if payload.description is not None:
            project.description = payload.description
        if payload.technologies is not None:
            project.technologies = payload.technologies
        if payload.repository_url is not None:
            project.repository_url = payload.repository_url
        if payload.documentation_url is not None:
            project.documentation_url = payload.documentation_url
        if payload.architecture_summary is not None:
            project.architecture_summary = payload.architecture_summary
        if payload.resource_ids is not None:
            resources = self.db.query(Resource).filter(Resource.id.in_(payload.resource_ids)).all()
            project.resources = resources

        return self.repository.update(project)

    def delete_project(self, project_id: int, actor: User) -> bool:
        project = self.get_project_by_id(project_id)
        return self.repository.delete(project)
