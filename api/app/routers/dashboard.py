from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.logbook import LogbookEntry
from app.models.resource import Resource
from app.models.trip import Trip, TripStatus
from app.models.user_achievement import UserAchievement
from app.schemas.user import DashboardResponse, UserResponse
from app.schemas.achievement import UserAchievementResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    total_logbook = db.query(LogbookEntry).filter(LogbookEntry.user_id == user.id).count()

    resources = db.query(Resource).filter(Resource.user_id == user.id).all()
    total_resources = len(resources)
    critical_below = sum(
        1 for r in resources if r.is_critical and r.current_amount <= r.min_threshold
    )

    active_trip = (
        db.query(Trip)
        .filter(Trip.user_id == user.id, Trip.status == TripStatus.ACTIVE)
        .first()
    )

    recent_achievements = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == user.id)
        .order_by(UserAchievement.earned_at.desc())
        .limit(5)
        .all()
    )

    return DashboardResponse(
        user=UserResponse.model_validate(user),
        total_logbook_entries=total_logbook,
        total_resources=total_resources,
        critical_resources_below_threshold=critical_below,
        active_trip={
            "id": str(active_trip.id),
            "destination": active_trip.destination,
            "initial_oxygen": active_trip.initial_oxygen,
            "oxygen_consumed": active_trip.oxygen_consumed,
            "started_at": active_trip.started_at.isoformat(),
        } if active_trip else None,
        recent_achievements=[
            UserAchievementResponse.model_validate(ua) for ua in recent_achievements
        ],
    )