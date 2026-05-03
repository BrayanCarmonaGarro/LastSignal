# app/models/resource.py
from sqlalchemy import Boolean, Column, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Resource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    base_resource_id = Column(UUID(as_uuid=True), ForeignKey("base_resources.id"), nullable=False)
    current_amount   = Column(Float, nullable=False)
    is_critical      = Column(Boolean, nullable=False, default=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    base_resource = relationship("BaseResource", back_populates="resources")
    user          = relationship("User", back_populates="resources")
    logs          = relationship("ResourceLog", back_populates="resource")