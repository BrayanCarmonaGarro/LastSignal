from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.logbook import LogbookEntry
from app.models.inventory_resource import InventoryResource
from app.models.trip import Trip, TripStatus
from app.models.user_achievement import UserAchievement
from app.routers.inventory import serialize_inventory
from app.schemas.achievement import UserAchievementResponse
from app.schemas.logbook import LogbookEntryResponse
from app.schemas.inventory_resource import InventoryResourceResponse
from app.schemas.user import (
    ActiveTripSummary,
    DashboardResponse,
    ResourceCategoryGroup,
    UserResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    total_logbook = db.query(LogbookEntry).filter(LogbookEntry.user_id == user.id).count()

    inventory = (
        db.query(InventoryResource)
        .options(joinedload(InventoryResource.base_resource))
        .filter(InventoryResource.user_id == user.id)
        .all()
    )
    total_resources = len(inventory)
    critical_below = sum(
        1 for r in inventory if r.current_amount <= r.base_resource.min_threshold
    )

    category_map: dict = defaultdict(list)
    for r in inventory:
        category_map[r.base_resource.category.value].append(r)

    resource_groups = [
        ResourceCategoryGroup(
            category=cat,
            resources=[InventoryResourceResponse(**serialize_inventory(r)) for r in rs],
            critical_count=sum(
                1 for r in rs if r.current_amount <= r.base_resource.min_threshold
            ),
        )
        for cat, rs in category_map.items()
    ]

    active_trip = (
        db.query(Trip)
        .filter(Trip.user_id == user.id, Trip.status == TripStatus.ACTIVE)
        .first()
    )

    active_trip_summary = None
    if active_trip:
        active_trip_summary = ActiveTripSummary(
            id=str(active_trip.id),
            destination=active_trip.destination,
            initial_oxygen=active_trip.initial_oxygen,
            oxygen_consumed=active_trip.oxygen_consumed,
            started_at=active_trip.started_at.isoformat(),
        )

    recent_logbook = (
        db.query(LogbookEntry)
        .filter(LogbookEntry.user_id == user.id)
        .order_by(LogbookEntry.created_at.desc())
        .limit(5)
        .all()
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
        active_trip=active_trip_summary,
        recent_achievements=[
            UserAchievementResponse.model_validate(ua) for ua in recent_achievements
        ],
        resource_groups=resource_groups,
        recent_logbook_entries=[
            LogbookEntryResponse.model_validate(e) for e in recent_logbook
        ],
    )
