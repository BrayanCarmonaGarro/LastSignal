from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.schemas.achievement import AchievementResponse, UserAchievementResponse

router = APIRouter(prefix="/achievements", tags=["Logros"])


@router.get("", response_model=List[AchievementResponse])
async def list_all_achievements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(Achievement).all()


@router.get("/mine", response_model=List[UserAchievementResponse])
async def list_my_achievements(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == user.id)
        .order_by(UserAchievement.earned_at.desc())
        .all()
    )