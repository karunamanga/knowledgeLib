from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.modules.knowledge.models import Resource
from app.modules.categories.models import Category, Tag
from app.modules.users.models import User
from app.shared.enums import ResourceType

class KnowledgeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, resource_id: int) -> Optional[Resource]:
        return self.db.query(Resource).filter(Resource.id == resource_id).first()

    def list_resources(
        self,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        resource_type: Optional[ResourceType] = None,
        tag: Optional[str] = None,
        author_id: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[Resource], int]:
        query = self.db.query(Resource)

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Resource.title.ilike(pattern),
                    Resource.description.ilike(pattern),
                    Resource.author.has(User.full_name.ilike(pattern)),
                    Resource.category.has(Category.name.ilike(pattern)),
                    Resource.tags.any(Tag.name.ilike(pattern))
                )
            )

        if category_id:
            query = query.filter(Resource.category_id == category_id)

        if resource_type:
            query = query.filter(Resource.resource_type == resource_type)

        if tag:
            query = query.filter(Resource.tags.any(Tag.slug == tag.lower().strip()))

        if author_id:
            query = query.filter(Resource.author_id == author_id)

        # Sorting
        order_col = Resource.created_at
        if sort_by == "views":
            order_col = Resource.view_count
        elif sort_by == "downloads":
            order_col = Resource.download_count
        elif sort_by == "title":
            order_col = Resource.title
        elif sort_by == "updated_at":
            order_col = Resource.updated_at

        if sort_order.lower() == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        total = query.distinct().count()
        items = query.distinct().offset(offset).limit(limit).all()
        return items, total

    def create(self, resource: Resource) -> Resource:
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def update(self, resource: Resource) -> Resource:
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def delete(self, resource: Resource) -> bool:
        self.db.delete(resource)
        self.db.commit()
        return True

    def increment_views(self, resource: Resource) -> None:
        resource.view_count = (resource.view_count or 0) + 1
        self.db.commit()

    def increment_downloads(self, resource: Resource) -> None:
        resource.download_count = (resource.download_count or 0) + 1
        self.db.commit()
