# app/schemas/resource.py
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.base_resource import ResourceCategory, ResourceUnit  # ← movido a base_resource
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


class ResourceCreate(BaseModel):
    base_resource_id: UUID
    current_amount: float
    is_critical: bool = False


class ResourceUpdate(BaseModel):
    current_amount: Optional[float] = None
    is_critical: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: UUID
    base_resource_id: UUID
    current_amount: float
    is_critical: bool
    user_id: UUID

    # Campos aplanados del join con base_resource
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    min_threshold: float

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