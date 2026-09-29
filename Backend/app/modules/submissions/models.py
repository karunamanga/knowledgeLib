from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.shared.enums import SubmissionStatus

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_entry_id = Column(Integer, ForeignKey("learning_entries.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.DRAFT, nullable=False, index=True)
    
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    feedback = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="submissions", lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews", lazy="joined")
    learning_entry = relationship("LearningEntry", back_populates="submissions", lazy="joined")
    history = relationship("SubmissionHistory", back_populates="submission", cascade="all, delete-orphan", order_by="SubmissionHistory.created_at.desc()")

class SubmissionHistory(Base):
    __tablename__ = "submission_history"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(SubmissionStatus), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="history")
    actor = relationship("User", lazy="joined")
