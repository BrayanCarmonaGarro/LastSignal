# Schemas Pydantic
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.logbook import DangerLevel, LifeFormCategory, SyncStatus


class LogbookEntryCreate(BaseModel):
    photo_url: str
    description: str
    classification: LifeFormCategory
    danger_level: DangerLevel = DangerLevel.UNKNOWN


class LogbookEntryUpdate(BaseModel):
    description: Optional[str] = None
    classification: Optional[LifeFormCategory] = None
    danger_level: Optional[DangerLevel] = None
    is_ai_reviewed: Optional[bool] = None


class LogbookEntryResponse(BaseModel):
    id: UUID
    photo_url: str
    description: str
    classification: LifeFormCategory
    danger_level: DangerLevel
    audio_url: Optional[str]
    ai_confidence: Optional[float]
    is_ai_reviewed: bool
    sync_status: SyncStatus
    is_downloaded: bool
    downloaded_until: Optional[datetime] = None
    created_at: datetime
    user_id: UUID
    similar_findings: list[str] = []  # Nuevo campo para incluir hallazgos similares

    class Config:
        from_attributes = True


class LifeFormSearchResponse(BaseModel):
    id: UUID
    photo_url: str
    matched_entry_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True