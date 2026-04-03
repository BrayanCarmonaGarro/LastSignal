from datetime import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.supply_drop import SupplyDrop, SupplyDropStatus
from app.models.supply_drop_item import SupplyDropItem
from app.schemas.supply_drop import (
    SupplyDropCollect,
    SupplyDropCreate,
    SupplyDropResponse,
)

router = APIRouter(prefix="/supply-drops", tags=["Suministros NASA"])


@router.get("", response_model=List[SupplyDropResponse])
async def list_supply_drops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(SupplyDrop).order_by(SupplyDrop.created_at.desc()).all()


@router.get("/available", response_model=List[SupplyDropResponse])
async def list_available_drops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return (
        db.query(SupplyDrop)
        .filter(SupplyDrop.status == SupplyDropStatus.AVAILABLE)
        .all()
    )


@router.post("", response_model=SupplyDropResponse, status_code=status.HTTP_201_CREATED)
async def create_supply_drop(
    drop: SupplyDropCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_drop = SupplyDrop(latitude=drop.latitude, longitude=drop.longitude)
    db.add(db_drop)
    db.flush()

    for item in drop.items:
        db_item = SupplyDropItem(
            supply_drop_id=db_drop.id,
            resource_id=item.resource_id,
            amount=item.amount,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_drop)
    return db_drop


@router.get("/{drop_id}", response_model=SupplyDropResponse)
async def get_supply_drop(
    drop_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    drop = db.query(SupplyDrop).filter(SupplyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")
    return drop


@router.post("/{drop_id}/collect", response_model=SupplyDropResponse)
async def collect_supply_drop(
    drop_id: UUID,
    data: SupplyDropCollect,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    drop = db.query(SupplyDrop).filter(SupplyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")
    if drop.status == SupplyDropStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="Este suministro ya fue recolectado")

    drop.status = SupplyDropStatus.COLLECTED
    drop.collected_by = user.id
    drop.collected_at = datetime.utcnow()
    drop.trip_id = data.trip_id

    db.commit()
    db.refresh(drop)
    return drop