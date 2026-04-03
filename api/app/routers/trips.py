from datetime import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.trip import Trip, TripStatus
from app.schemas.trip import TripCreate, TripResponse, TripUpdate
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