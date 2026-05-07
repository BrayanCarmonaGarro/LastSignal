from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.user import UserRole
from app.core.constants import USERNAME_PATTERN
from app.schemas.ship_base import ShipBaseResponse


class UserResponse(BaseModel):
    id: UUID
    username: Optional[str]
    role: UserRole
    display_name: Optional[str]
    avatar_url: Optional[str]
    level: int
    experience_pts: int
    ship_base_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UsernameSetRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)

    def validate_format(self) -> bool:
        return bool(USERNAME_PATTERN.match(self.username))


class ActiveTripSummary(BaseModel):
    id: str
    destination: Optional[str]
    initial_oxygen: float
    oxygen_consumed: float
    started_at: str


class ResourceCategoryGroup(BaseModel):
    category: str
    resources: list
    critical_count: int


class DashboardResponse(BaseModel):
    user: UserResponse
    ship_base: Optional[ShipBaseResponse] = None
    total_logbook_entries: int
    total_resources: int
    critical_resources_below_threshold: int
    active_trip: Optional[ActiveTripSummary]
    recent_achievements: list
    resource_groups: list[ResourceCategoryGroup]
    recent_logbook_entries: list

class AddXpRequest(BaseModel):
    amount: int