from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.supply_drop import SupplyDropStatus


class SupplyDropItemCreate(BaseModel):
    resource_id: UUID
    amount: float


class SupplyDropItemResponse(BaseModel):
    id: UUID
    resource_id: UUID
    amount: float

    class Config:
        from_attributes = True


class SupplyDropCreate(BaseModel):
    latitude: float
    longitude: float
    items: List[SupplyDropItemCreate] = []


class SupplyDropCollect(BaseModel):
    trip_id: UUID


class SupplyDropResponse(BaseModel):
    id: UUID
    latitude: float
    longitude: float
    status: SupplyDropStatus
    trip_id: Optional[UUID]
    collected_by: Optional[UUID]
    collected_at: Optional[datetime]
    created_at: datetime
    items: List[SupplyDropItemResponse] = []

    class Config:
        from_attributes = True