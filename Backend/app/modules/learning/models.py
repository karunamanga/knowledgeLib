from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Table, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.shared.enums import LearningStatus

learning_entry_resources = Table(
    "learning_entry_resources",
    Base.metadata,
    Column("entry_id", Integer, ForeignKey("learning_entries.id", ondelete="CASCADE"), primary_key=True),
    Column("resource_id", Integer, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
)

class LearningEntry(Base):
    __tablename__ = "learning_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)  # What I learned today
    work_completed = Column(Text, nullable=True)  # Work completed / exercises
    learning_date = Column(Date, default=date.today, nullable=False, index=True)
    status = Column(SQLEnum(LearningStatus), default=LearningStatus.IN_PROGRESS, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="learning_entries", lazy="joined")
    resources = relationship("Resource", secondary=learning_entry_resources, lazy="joined")
    submissions = relationship("Submission", back_populates="learning_entry", cascade="all, delete-orphan")
