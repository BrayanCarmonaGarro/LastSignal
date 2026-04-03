import enum
from sqlalchemy import Boolean, Column, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class LifeFormCategory(str, enum.Enum):
    ANIMAL = "ANIMAL"
    PLANT = "PLANT"
    RESOURCE = "RESOURCE"
    MINERAL = "MINERAL"
    FUNGI = "FUNGI"
    UNKNOWN_ORGANISM = "UNKNOWN_ORGANISM"


class DangerLevel(str, enum.Enum):
    DANGEROUS = "DANGEROUS"
    FRIENDLY = "FRIENDLY"
    UNKNOWN = "UNKNOWN"


class SyncStatus(str, enum.Enum):
    SYNCED = "SYNCED"
    PENDING = "PENDING"
    FAILED = "FAILED"


class LogbookEntry(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "logbook_entries"

    photo_url = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    classification = Column(Enum(LifeFormCategory), nullable=False)
    danger_level = Column(Enum(DangerLevel), nullable=False, default=DangerLevel.UNKNOWN)
    audio_url = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_raw_response = Column(Text, nullable=True)
    is_ai_reviewed = Column(Boolean, nullable=False, default=False)
    sync_status = Column(Enum(SyncStatus), nullable=False, default=SyncStatus.SYNCED)
    is_downloaded = Column(Boolean, nullable=False, default=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="logbook_entries")


class LifeFormSearch(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "life_form_searches"

    photo_url = Column(Text, nullable=False)
    matched_entry_id = Column(UUID(as_uuid=True), ForeignKey("logbook_entries.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    matched_entry = relationship("LogbookEntry")
    user = relationship("User")