from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.trip_waypoint import WaypointStatus


class WaypointCreate(BaseModel):
    name: Optional[str] = None
    latitude: float
    longitude: float


class WaypointUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[WaypointStatus] = None
    reached_at: Optional[datetime] = None


class WaypointResponse(BaseModel):
    id: UUID
    name: Optional[str]
    latitude: float
    longitude: float
    status: WaypointStatus
    reached_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
