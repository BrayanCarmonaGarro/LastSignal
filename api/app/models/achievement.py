from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class Achievement(UUIDMixin, Base):
    __tablename__ = "achievements"

    key = Column(String(80), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    icon_url = Column(Text, nullable=True)

    user_achievements = relationship("UserAchievement", back_populates="achievement")