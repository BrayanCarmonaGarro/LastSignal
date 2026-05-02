# routers/supply_drops.py
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.resource import Resource
from app.models.supply_drop import SupplyDrop, SupplyDropStatus
from app.models.supply_drop_item import SupplyDropItem
from app.schemas.supply_drop import (
    SupplyDropCollect,
    SupplyDropCreate,
    SupplyDropResponse,
)

router = APIRouter(prefix="/supply-drops", tags=["Suministros NASA"])


# ─────────────────────────────────────────────────────────────
# GET ALL DROPS (con items + base_resource)
# ─────────────────────────────────────────────────────────────
@router.get("", response_model=List[SupplyDropResponse])
async def list_supply_drops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .order_by(SupplyDrop.created_at.desc())
        .all()
    )


# ─────────────────────────────────────────────────────────────
# GET AVAILABLE DROPS (con items + base_resource)
# ─────────────────────────────────────────────────────────────
@router.get("/available", response_model=List[SupplyDropResponse])
async def list_available_drops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .filter(SupplyDrop.status == SupplyDropStatus.AVAILABLE)
        .all()
    )


# ─────────────────────────────────────────────────────────────
# CREATE DROP
# ─────────────────────────────────────────────────────────────
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
            base_resource_id=item.base_resource_id,
            amount=item.amount,
        )
        db.add(db_item)

    db.commit()

    return (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .filter(SupplyDrop.id == db_drop.id)
        .first()
    )


# ─────────────────────────────────────────────────────────────
# GET ONE DROP
# ─────────────────────────────────────────────────────────────
@router.get("/{drop_id}", response_model=SupplyDropResponse)
async def get_supply_drop(
    drop_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    drop = (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .filter(SupplyDrop.id == drop_id)
        .first()
    )

    if not drop:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")

    return drop


# ─────────────────────────────────────────────────────────────
# COLLECT DROP
# ─────────────────────────────────────────────────────────────
@router.post("/{drop_id}/collect", response_model=SupplyDropResponse)
async def collect_supply_drop(
    drop_id: UUID,
    data: SupplyDropCollect,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    drop = (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .filter(SupplyDrop.id == drop_id)
        .first()
    )

    if not drop:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")

    if drop.status == SupplyDropStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="Este suministro ya fue recolectado")

    # ── Sumar o crear recursos en el inventario del usuario ──────────────────
    for item in drop.items:
        base = item.base_resource  # ya cargado por joinedload

        existing = (
            db.query(Resource)
            .filter(
                Resource.user_id == user.id,
                Resource.base_resource_id == base.id,  # ← buscar por base_resource_id
            )
            .first()
        )

        if existing:
            existing.current_amount += item.amount
            existing.is_critical = existing.current_amount <= base.min_threshold
        else:
            new_resource = Resource(
                base_resource_id=base.id,
                current_amount=item.amount,
                is_critical=item.amount <= base.min_threshold,
                user_id=user.id,
            )
            db.add(new_resource)

    # ── Marcar el drop como recolectado ──────────────────────────────────────
    drop.status = SupplyDropStatus.COLLECTED
    drop.collected_by = user.id
    drop.collected_at = datetime.utcnow()
    drop.trip_id = data.trip_id

    db.commit()

    return (
        db.query(SupplyDrop)
        .options(
            joinedload(SupplyDrop.items)
            .joinedload(SupplyDropItem.base_resource)
        )
        .filter(SupplyDrop.id == drop_id)
        .first()
    )