from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.users.models import User, Role, Permission

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def list_users(self, search: Optional[str] = None, role_id: Optional[int] = None,
                   is_active: Optional[bool] = None, offset: int = 0, limit: int = 20) -> Tuple[List[User], int]:
        query = self.db.query(User)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(User.full_name.ilike(pattern), User.email.ilike(pattern), User.department.ilike(pattern)))
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if role_id:
            query = query.filter(User.roles.any(Role.id == role_id))

        total = query.count()
        items = query.order_by(User.id.asc()).offset(offset).limit(limit).all()
        return items, total

    def create_user(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user: User) -> bool:
        self.db.delete(user)
        self.db.commit()
        return True

    def get_role_by_id(self, role_id: int) -> Optional[Role]:
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_role_by_name(self, name: str) -> Optional[Role]:
        return self.db.query(Role).filter(Role.name == name).first()

    def list_roles(self) -> List[Role]:
        return self.db.query(Role).all()

    def list_permissions(self) -> List[Permission]:
        return self.db.query(Permission).all()
