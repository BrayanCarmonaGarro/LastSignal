import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class DangerSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TripDangerZone(UUIDMixin, Base):
    __tablename__ = "trip_danger_zones"

    description = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(Enum(DangerSeverity), nullable=False, default=DangerSeverity.MEDIUM)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    trip = relationship("Trip", back_populates="danger_zones")
