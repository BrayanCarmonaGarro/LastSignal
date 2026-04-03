from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class UserAchievement(UUIDMixin, Base):
    __tablename__ = "user_achievements"

    earned_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False)

    user = relationship("User", back_populates="user_achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")