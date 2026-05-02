# app/models/base_resource.py
import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, Enum, Float, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin


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


class BaseResource(UUIDMixin, Base):
    __tablename__ = "base_resources"

    name          = Column(String(120), nullable=False)
    category      = Column(Enum("VITAL", "FOOD", "EQUIPMENT", "MEDICAL", "FUEL",
                                name="resource_category_enum"), nullable=False)
    unit          = Column(Enum("LITERS", "KILOGRAMS", "UNITS", "PERCENTAGE", "GRAMS", "CALORIES",
                                name="resource_unit_enum"), nullable=False)
    min_threshold = Column(Float, nullable=False)
    is_critical   = Column(Boolean, nullable=False, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    resources = relationship("Resource", back_populates="base_resource")