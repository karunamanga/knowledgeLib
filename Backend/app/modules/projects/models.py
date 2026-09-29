from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

project_resources = Table(
    "project_resources",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("resource_id", Integer, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    problem_statement = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    technologies = Column(String(500), nullable=True)  # Comma-separated or JSON list of tech badges
    repository_url = Column(String(500), nullable=True)
    documentation_url = Column(String(500), nullable=True)
    architecture_summary = Column(Text, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", lazy="joined")
    resources = relationship("Resource", secondary=project_resources, lazy="joined")
