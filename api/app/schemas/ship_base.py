from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ShipBaseResponse(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float
    created_at: datetime

    class Config:
        from_attributes = True
