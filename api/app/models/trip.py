# Models/trip.py
import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class TripStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class Trip(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "trips"

    destination = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    initial_oxygen = Column(Float, nullable=False)
    oxygen_consumed = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.ACTIVE)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="trips")
    supply_drops = relationship("SupplyDrop", back_populates="trip")
    waypoints   = relationship("TripWaypoint",   back_populates="trip", lazy="select")
    danger_zones = relationship("TripDangerZone", back_populates="trip", lazy="select")