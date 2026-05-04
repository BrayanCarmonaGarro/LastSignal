from sqlalchemy import Column, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class BaseStorage(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "base_storage"

    base_resource_id = Column(UUID(as_uuid=True), ForeignKey("base_resources.id"), nullable=False)
    current_amount = Column(Float, nullable=False)
    ship_base_id = Column(UUID(as_uuid=True), ForeignKey("ship_bases.id"), nullable=False)

    base_resource = relationship("BaseResource")
    ship_base = relationship("ShipBase", back_populates="base_storage")
    logs = relationship("ResourceLog", back_populates="base_storage")
