import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class WaypointStatus(str, enum.Enum):
    PENDING = "PENDING"
    REACHED = "REACHED"


class TripWaypoint(UUIDMixin, Base):
    __tablename__ = "trip_waypoints"

    name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(Enum(WaypointStatus), nullable=False, default=WaypointStatus.PENDING)
    reached_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    trip = relationship("Trip", back_populates="waypoints")
