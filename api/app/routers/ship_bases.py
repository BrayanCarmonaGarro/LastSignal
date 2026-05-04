# app/routers/ship_bases.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.ship_base import ShipBase
from app.models.user import User
from app.schemas.ship_base import ShipBaseCreateRequest, ShipBaseResponse

router = APIRouter(prefix="/ship-bases", tags=["Bases de Nave"])


@router.post("", response_model=ShipBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_ship_base(
    body: ShipBaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Crear una base de nave y asignarla al usuario actual."""
    user = await resolve_db_user(current_user, db)

    if user.ship_base_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya tienes una base de nave asignada",
        )

    new_base = ShipBase(name=body.name, latitude=body.latitude, longitude=body.longitude)
    db.add(new_base)
    db.flush()

    user.ship_base_id = new_base.id
    db.commit()
    db.refresh(new_base)
    return new_base


@router.get("", response_model=List[ShipBaseResponse])
async def list_ship_bases(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Listar todas las bases de naves disponibles."""
    return db.query(ShipBase).order_by(ShipBase.created_at).all()


@router.get("/me", response_model=ShipBaseResponse)
async def get_my_ship_base(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtener la base de nave asignada al usuario actual."""
    user = await resolve_db_user(current_user, db)
    if not user.ship_base_id:
        raise HTTPException(status_code=404, detail="No tienes base de nave asignada")
    
    ship_base = db.query(ShipBase).filter(ShipBase.id == user.ship_base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")
    return ship_base


@router.get("/{base_id}", response_model=ShipBaseResponse)
async def get_ship_base(
    base_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtener detalles de una base de nave específica."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")
    return ship_base
