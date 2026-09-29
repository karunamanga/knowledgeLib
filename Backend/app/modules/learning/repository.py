from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.modules.learning.models import LearningEntry
from app.modules.knowledge.models import Resource

class LearningRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entry_id: int) -> Optional[LearningEntry]:
        return self.db.query(LearningEntry).filter(LearningEntry.id == entry_id).first()

    def list_entries(
        self,
        user_id: Optional[int] = None,
        search: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[LearningEntry], int]:
        query = self.db.query(LearningEntry)
        if user_id:
            query = query.filter(LearningEntry.user_id == user_id)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(LearningEntry.title.ilike(pattern), LearningEntry.description.ilike(pattern)))
        if from_date:
            query = query.filter(LearningEntry.learning_date >= from_date)
        if to_date:
            query = query.filter(LearningEntry.learning_date <= to_date)

        total = query.count()
        items = query.order_by(LearningEntry.learning_date.desc(), LearningEntry.id.desc()).offset(offset).limit(limit).all()
        return items, total

    def create(self, entry: LearningEntry) -> LearningEntry:
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def update(self, entry: LearningEntry) -> LearningEntry:
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: LearningEntry) -> bool:
        self.db.delete(entry)
        self.db.commit()
        return True
