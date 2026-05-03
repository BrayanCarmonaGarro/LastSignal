from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.user import UserRole
from app.core.constants import USERNAME_PATTERN


class UserResponse(BaseModel):
    id: UUID
    username: Optional[str]
    role: UserRole
    display_name: Optional[str]
    avatar_url: Optional[str]
    level: int
    experience_pts: int
    created_at: datetime

    class Config:
        from_attributes = True


class UsernameSetRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)

    def validate_format(self) -> bool:
        return bool(USERNAME_PATTERN.match(self.username))


class DashboardResponse(BaseModel):
    user: UserResponse
    total_logbook_entries: int
    total_resources: int
    critical_resources_below_threshold: int
    active_trip: Optional[dict]
    recent_achievements: list