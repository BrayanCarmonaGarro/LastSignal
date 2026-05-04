from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ShipBaseCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    latitude: float
    longitude: float


class ShipBaseResponse(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float
    created_at: datetime

    class Config:
        from_attributes = True
