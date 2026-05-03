import enum
from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ASTRONAUT = "ASTRONAUT"
    ADMIN = "ADMIN"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username = Column(String(80), unique=True, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.ASTRONAUT)
    display_name = Column(String(120))
    avatar_url = Column(String)
    level = Column(Integer, nullable=False, default=1)
    experience_pts = Column(Integer, nullable=False, default=0)

    logbook_entries = relationship("LogbookEntry", back_populates="user")
    resources = relationship("Resource", back_populates="user")
    trips = relationship("Trip", back_populates="user")
    user_achievements = relationship("UserAchievement", back_populates="user")