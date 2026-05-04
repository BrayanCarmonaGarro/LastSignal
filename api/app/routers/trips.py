# Routers/trips.py
from datetime import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.trip import Trip, TripStatus
from app.models.trip_waypoint import TripWaypoint, WaypointStatus
from app.models.trip_danger_zone import TripDangerZone
from app.schemas.trip import TripCreate, TripResponse, TripUpdate
from app.schemas.trip_waypoint import WaypointCreate, WaypointUpdate, WaypointResponse
from app.schemas.trip_danger_zone import DangerZoneCreate, DangerZoneUpdate, DangerZoneResponse
from app.services.achievement_service import check_and_award_achievements

router = APIRouter(prefix="/trips", tags=["Viajes"])


@router.get("", response_model=List[TripResponse])
async def list_trips(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return (
        db.query(Trip)
        .filter(Trip.user_id == user.id)
        .order_by(Trip.started_at.desc())
        .all()
    )


@router.get("/active", response_model=TripResponse)
async def get_active_trip(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.user_id == user.id, Trip.status == TripStatus.ACTIVE)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="No hay viaje activo")
    return trip


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def start_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    active = (
        db.query(Trip)
        .filter(Trip.user_id == user.id, Trip.status == TripStatus.ACTIVE)
        .first()
    )
    if active:
        raise HTTPException(
            status_code=400, detail="Ya hay un viaje activo, terminalo antes de iniciar uno nuevo"
        )

    db_trip = Trip(**trip.model_dump(), user_id=user.id)
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.patch("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: UUID,
    data: TripUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/complete", response_model=TripResponse)
async def complete_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if trip.status == TripStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="El viaje ya fue completado")

    trip.status = TripStatus.COMPLETED
    trip.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)

    check_and_award_achievements(str(user.id), db)

    return trip


# ─────────────────────────────────────────────────────────────
# WAYPOINTS ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("/{trip_id}/waypoints", response_model=WaypointResponse, status_code=status.HTTP_201_CREATED)
async def create_waypoint(
    trip_id: UUID,
    waypoint: WaypointCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    db_waypoint = TripWaypoint(
        **waypoint.model_dump(),
        trip_id=trip_id,
    )
    db.add(db_waypoint)
    db.commit()
    db.refresh(db_waypoint)
    return db_waypoint


@router.get("/{trip_id}/waypoints", response_model=List[WaypointResponse])
async def list_waypoints(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    return (
        db.query(TripWaypoint)
        .filter(TripWaypoint.trip_id == trip_id)
        .order_by(TripWaypoint.created_at)
        .all()
    )


@router.patch("/{trip_id}/waypoints/{waypoint_id}", response_model=WaypointResponse)
async def update_waypoint(
    trip_id: UUID,
    waypoint_id: UUID,
    data: WaypointUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    waypoint = (
        db.query(TripWaypoint)
        .filter(TripWaypoint.id == waypoint_id, TripWaypoint.trip_id == trip_id)
        .first()
    )
    if not waypoint:
        raise HTTPException(status_code=404, detail="Waypoint no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            if field == "status" and value == WaypointStatus.REACHED and waypoint.reached_at is None:
                waypoint.reached_at = datetime.utcnow()
            setattr(waypoint, field, value)

    db.commit()
    db.refresh(waypoint)
    return waypoint


@router.delete("/{trip_id}/waypoints/{waypoint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_waypoint(
    trip_id: UUID,
    waypoint_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    waypoint = (
        db.query(TripWaypoint)
        .filter(TripWaypoint.id == waypoint_id, TripWaypoint.trip_id == trip_id)
        .first()
    )
    if not waypoint:
        raise HTTPException(status_code=404, detail="Waypoint no encontrado")

    db.delete(waypoint)
    db.commit()


# ─────────────────────────────────────────────────────────────
# DANGER ZONES ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("/{trip_id}/danger-zones", response_model=DangerZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_danger_zone(
    trip_id: UUID,
    zone: DangerZoneCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    db_zone = TripDangerZone(
        **zone.model_dump(),
        trip_id=trip_id,
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone


@router.get("/{trip_id}/danger-zones", response_model=List[DangerZoneResponse])
async def list_danger_zones(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    return (
        db.query(TripDangerZone)
        .filter(TripDangerZone.trip_id == trip_id)
        .order_by(TripDangerZone.created_at)
        .all()
    )


@router.patch("/{trip_id}/danger-zones/{zone_id}", response_model=DangerZoneResponse)
async def update_danger_zone(
    trip_id: UUID,
    zone_id: UUID,
    data: DangerZoneUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    zone = (
        db.query(TripDangerZone)
        .filter(TripDangerZone.id == zone_id, TripDangerZone.trip_id == trip_id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Zona de peligro no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(zone, field, value)

    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{trip_id}/danger-zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_danger_zone(
    trip_id: UUID,
    zone_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    zone = (
        db.query(TripDangerZone)
        .filter(TripDangerZone.id == zone_id, TripDangerZone.trip_id == trip_id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Zona de peligro no encontrada")

    db.delete(zone)
    db.commit()