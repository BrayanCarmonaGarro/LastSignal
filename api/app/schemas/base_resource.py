# app/schemas/base_resource.py
from uuid import UUID
from app.models.base_resource import ResourceCategory, ResourceUnit
from pydantic import BaseModel


class BaseResourceResponse(BaseModel):
    id: UUID
    name: str
    category: ResourceCategory
    unit: ResourceUnit
    min_threshold: float
    is_critical: bool

    class Config:
        from_attributes = True