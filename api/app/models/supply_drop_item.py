from sqlalchemy import Column, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class SupplyDropItem(UUIDMixin, Base):
    __tablename__ = "supply_drop_items"

    amount = Column(Float, nullable=False)

    supply_drop_id = Column(UUID(as_uuid=True), ForeignKey("supply_drops.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)

    supply_drop = relationship("SupplyDrop", back_populates="items")
    resource = relationship("Resource")