# app/schemas/resource.py
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.base_resource import ResourceCategory, ResourceUnit
from app.models.resource_log import ResourceLogType


class BaseResourceResponse(BaseModel):
    id: UUID
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    min_threshold: float
    is_critical: bool

    class Config:
        from_attributes = True


class ResourceLogCreate(BaseModel):
    type: ResourceLogType
    amount: float
    reason: Optional[str] = None
    inventory_resource_id: Optional[UUID] = None
    base_storage_id: Optional[UUID] = None
    trip_id: Optional[UUID] = None


class ResourceLogResponse(BaseModel):
    id: UUID
    type: ResourceLogType
    amount: float
    reason: Optional[str]
    inventory_resource_id: Optional[UUID] = None
    base_storage_id: Optional[UUID] = None
    trip_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True