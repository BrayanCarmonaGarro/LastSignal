# Schemas/trip.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.trip import TripStatus


class TripCreate(BaseModel):
    destination: Optional[str] = None
    initial_oxygen: float


class TripUpdate(BaseModel):
    notes: Optional[str] = None
    oxygen_consumed: Optional[float] = None
    status: Optional[TripStatus] = None
    ended_at: Optional[datetime] = None


class TripResponse(BaseModel):
    id: UUID
    destination: Optional[str]
    notes: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    initial_oxygen: float
    oxygen_consumed: float
    status: TripStatus
    user_id: UUID
    waypoints: Optional[List] = []
    danger_zones: Optional[List] = []

    class Config:
        from_attributes = True