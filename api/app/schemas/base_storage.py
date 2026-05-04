from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.schemas.base_resource import BaseResourceResponse


class BaseStorageResponse(BaseModel):
    id: UUID
    base_resource_id: UUID
    current_amount: float
    ship_base_id: UUID
    created_at: datetime
    
    # Campos aplanados del join con base_resource
    name: str
    category: str
    unit: str
    min_threshold: float

    class Config:
        from_attributes = True
