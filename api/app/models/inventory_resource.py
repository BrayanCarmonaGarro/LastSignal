# app/models/inventory_resource.py
from sqlalchemy import Column, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class InventoryResource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "inventory_resources"

    base_resource_id = Column(UUID(as_uuid=True), ForeignKey("base_resources.id"), nullable=False)
    current_amount = Column(Float, nullable=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    base_resource = relationship("BaseResource", back_populates="inventory_resources")
    user = relationship("User", back_populates="inventory_resources")
    logs = relationship("ResourceLog", back_populates="inventory_resource")
