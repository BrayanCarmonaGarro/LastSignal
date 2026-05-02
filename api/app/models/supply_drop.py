# Models/supply_drop.py
import enum
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class SupplyDropStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    COLLECTED = "COLLECTED"


class SupplyDrop(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "supply_drops"

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(Enum(SupplyDropStatus), nullable=False, default=SupplyDropStatus.AVAILABLE)
    collected_at = Column(DateTime, nullable=True)

    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)
    collected_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    trip = relationship("Trip", back_populates="supply_drops")
    collector = relationship("User")
    items = relationship("SupplyDropItem", back_populates="supply_drop")