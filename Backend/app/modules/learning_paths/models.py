from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    level = Column(String(50), default="Beginner")  # Beginner, Intermediate, Advanced
    estimated_hours = Column(Float, default=10.0)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    modules = relationship("LearningModule", back_populates="path", cascade="all, delete-orphan", order_by="LearningModule.order_index")
    author = relationship("User", lazy="joined")
    user_progress = relationship("UserPathProgress", back_populates="path", cascade="all, delete-orphan")

class LearningModule(Base):
    __tablename__ = "learning_modules"

    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    path = relationship("LearningPath", back_populates="modules")
    resources = relationship("LearningModuleResource", back_populates="module", cascade="all, delete-orphan", order_by="LearningModuleResource.order_index")
    user_module_progress = relationship("UserModuleProgress", back_populates="module", cascade="all, delete-orphan")

class LearningModuleResource(Base):
    __tablename__ = "learning_module_resources"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("learning_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, default=0)

    module = relationship("LearningModule", back_populates="resources")
    resource = relationship("Resource", back_populates="learning_modules", lazy="joined")

class UserPathProgress(Base):
    __tablename__ = "user_path_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    progress_percentage = Column(Float, default=0.0)
    status = Column(String(50), default="IN_PROGRESS")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    path = relationship("LearningPath", back_populates="user_progress")
    user = relationship("User")

class UserModuleProgress(Base):
    __tablename__ = "user_module_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey("learning_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    module = relationship("LearningModule", back_populates="user_module_progress")
    user = relationship("User")
