from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ShipBase(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "ship_bases"

    name = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    users = relationship("User", back_populates="ship_base")
    base_storage = relationship("BaseStorage", back_populates="ship_base")
