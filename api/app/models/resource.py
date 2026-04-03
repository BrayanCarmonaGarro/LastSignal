import enum
from sqlalchemy import Boolean, Column, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ResourceCategory(str, enum.Enum):
    VITAL = "VITAL"
    FOOD = "FOOD"
    EQUIPMENT = "EQUIPMENT"
    MEDICAL = "MEDICAL"
    FUEL = "FUEL"


class ResourceUnit(str, enum.Enum):
    LITERS = "LITERS"
    KILOGRAMS = "KILOGRAMS"
    UNITS = "UNITS"
    PERCENTAGE = "PERCENTAGE"
    GRAMS = "GRAMS"
    CALORIES = "CALORIES"


class Resource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    name = Column(String(120), nullable=False)
    category = Column(Enum(ResourceCategory), nullable=False)
    unit = Column(Enum(ResourceUnit), nullable=False)
    current_amount = Column(Float, nullable=False)
    min_threshold = Column(Float, nullable=False)
    is_critical = Column(Boolean, nullable=False, default=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="resources")
    logs = relationship("ResourceLog", back_populates="resource")