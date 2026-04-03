from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.user import UserRole


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: UserRole
    display_name: Optional[str]
    avatar_url: Optional[str]
    level: int
    experience_pts: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    user: UserResponse
    total_logbook_entries: int
    total_resources: int
    critical_resources_below_threshold: int
    active_trip: Optional[dict]
    recent_achievements: list