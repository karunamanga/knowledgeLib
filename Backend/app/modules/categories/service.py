from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, ConflictException
from app.modules.categories.models import Category, Tag
from app.modules.categories.repository import CategoryRepository, slugify
from app.modules.categories.schemas import CategoryCreate, CategoryUpdate
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction

class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CategoryRepository(db)
        self.audit_service = AuditService(db)

    def list_categories(self) -> List[Category]:
        return self.repository.list_categories()

    def get_category_by_id(self, category_id: int) -> Category:
        cat = self.repository.get_by_id(category_id)
        if not cat:
            raise EntityNotFoundException(f"Category {category_id} not found")
        return cat

    def create_category(self, payload: CategoryCreate, actor: Optional[User] = None) -> Category:
        slug = slugify(payload.name)
        existing = self.repository.get_by_slug(slug)
        if existing:
            raise ConflictException(f"Category with name '{payload.name}' already exists")
        
        category = self.repository.create(
            name=payload.name,
            description=payload.description,
            icon=payload.icon,
            color=payload.color
        )
        return category

    def update_category(self, category_id: int, payload: CategoryUpdate, actor: Optional[User] = None) -> Category:
        category = self.get_category_by_id(category_id)
        if payload.name is not None:
            category.name = payload.name
            category.slug = slugify(payload.name)
        if payload.description is not None:
            category.description = payload.description
        if payload.icon is not None:
            category.icon = payload.icon
        if payload.color is not None:
            category.color = payload.color
        
        return self.repository.update(category)

    def delete_category(self, category_id: int, actor: Optional[User] = None) -> bool:
        category = self.get_category_by_id(category_id)
        return self.repository.delete(category)

    def list_tags(self) -> List[Tag]:
        return self.repository.list_tags()

    def get_or_create_tag(self, name: str) -> Tag:
        return self.repository.get_or_create_tag(name)
