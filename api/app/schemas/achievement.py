from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class AchievementResponse(BaseModel):
    id: UUID
    key: str
    name: str
    description: Optional[str]
    icon_url: Optional[str]

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: UUID
    achievement: AchievementResponse
    earned_at: datetime

    class Config:
        from_attributes = True