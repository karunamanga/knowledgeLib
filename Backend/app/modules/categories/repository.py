import re
from typing import Optional, List
from sqlalchemy.orm import Session
from app.modules.categories.models import Category, Tag

def slugify(text: str) -> str:
    text = text.lower().strip()
    return re.sub(r'[\s_]+', '-', re.sub(r'[^\w\s-]', '', text))

class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, category_id: int) -> Optional[Category]:
        return self.db.query(Category).filter(Category.id == category_id).first()

    def get_by_slug(self, slug: str) -> Optional[Category]:
        return self.db.query(Category).filter(Category.slug == slug).first()

    def list_categories(self) -> List[Category]:
        return self.db.query(Category).order_by(Category.name.asc()).all()

    def create(self, name: str, description: Optional[str] = None, icon: Optional[str] = None, color: Optional[str] = None) -> Category:
        slug = slugify(name)
        category = Category(name=name, slug=slug, description=description, icon=icon, color=color)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> bool:
        self.db.delete(category)
        self.db.commit()
        return True

    def get_or_create_tag(self, name: str) -> Tag:
        name_clean = name.strip()
        slug = slugify(name_clean)
        tag = self.db.query(Tag).filter(Tag.slug == slug).first()
        if not tag:
            tag = Tag(name=name_clean, slug=slug)
            self.db.add(tag)
            self.db.commit()
            self.db.refresh(tag)
        return tag

    def list_tags(self) -> List[Tag]:
        return self.db.query(Tag).order_by(Tag.name.asc()).all()
