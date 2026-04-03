import enum
from sqlalchemy import Column, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ResourceLogType(str, enum.Enum):
    INTAKE = "INTAKE"
    EXPENSE = "EXPENSE"


class ResourceLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resource_logs"

    type = Column(Enum(ResourceLogType), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)

    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=True)

    resource = relationship("Resource", back_populates="logs")
    trip = relationship("Trip")