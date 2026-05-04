# app/schemas/inventory_resource.py
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.base_resource import ResourceCategory, ResourceUnit


class InventoryResourceCreate(BaseModel):
    base_resource_id: UUID
    current_amount: float


class InventoryResourceUpdate(BaseModel):
    current_amount: Optional[float] = None


class InventoryResourceResponse(BaseModel):
    id: UUID
    base_resource_id: UUID
    current_amount: float
    user_id: UUID

    # Campos aplanados del join con base_resource
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    min_threshold: float
    is_critical: bool

    class Config:
        from_attributes = True
