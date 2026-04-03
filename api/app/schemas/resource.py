from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.resource import ResourceCategory, ResourceUnit
from app.models.resource_log import ResourceLogType


class ResourceCreate(BaseModel):
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    current_amount: float
    min_threshold: float
    is_critical: bool = False


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    current_amount: Optional[float] = None
    min_threshold: Optional[float] = None
    is_critical: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: UUID
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    current_amount: float
    min_threshold: float
    is_critical: bool
    user_id: UUID

    class Config:
        from_attributes = True


class ResourceLogCreate(BaseModel):
    type: ResourceLogType
    amount: float
    reason: Optional[str] = None
    trip_id: Optional[UUID] = None


class ResourceLogResponse(BaseModel):
    id: UUID
    resource_id: UUID
    type: ResourceLogType
    amount: float
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True