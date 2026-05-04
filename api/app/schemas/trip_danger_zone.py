from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.trip_danger_zone import DangerSeverity


class DangerZoneCreate(BaseModel):
    description: Optional[str] = None
    latitude: float
    longitude: float
    severity: DangerSeverity = DangerSeverity.MEDIUM


class DangerZoneUpdate(BaseModel):
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[DangerSeverity] = None


class DangerZoneResponse(BaseModel):
    id: UUID
    description: Optional[str]
    latitude: float
    longitude: float
    severity: DangerSeverity
    created_at: datetime

    class Config:
        from_attributes = True
