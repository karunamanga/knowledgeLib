from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.shared.enums import ResourceType

resource_tags = Table(
    "resource_tags",
    Base.metadata,
    Column("resource_id", Integer, ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    resource_type = Column(SQLEnum(ResourceType), nullable=False, default=ResourceType.DOCUMENT, index=True)
    
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # File Storage and Preview fields
    file_path = Column(String(500), nullable=True, index=True)
    preview_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True, index=True)  # PDF, DOC, DOCX, PPT, PPTX
    mime_type = Column(String(100), nullable=True)
    storage_bucket = Column(String(100), default="portal-files", nullable=True)

    # Backward compatibility aliases
    storage_key = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    external_url = Column(String(1000), nullable=True)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String(100), nullable=True)
    
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="authored_resources", lazy="joined")
    category = relationship("Category", back_populates="resources", lazy="joined")
    tags = relationship("Tag", secondary=resource_tags, back_populates="resources", lazy="joined")
    learning_modules = relationship("LearningModuleResource", back_populates="resource")
