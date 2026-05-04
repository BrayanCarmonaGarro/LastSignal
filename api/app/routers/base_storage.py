# app/routers/base_storage.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.base_storage import BaseStorage
from app.models.ship_base import ShipBase
from app.models.base_resource import BaseResource
from app.models.resource_log import ResourceLog, ResourceLogType
from app.schemas.base_storage import BaseStorageResponse
from app.schemas.resource import ResourceLogCreate, ResourceLogResponse

router = APIRouter(prefix="/ship-bases", tags=["Almacén de Nave"])


def serialize_base_storage(storage: BaseStorage) -> dict:
    """Aplana los campos de base_resource en el response."""
    return {
        "id": storage.id,
        "base_resource_id": storage.base_resource_id,
        "current_amount": storage.current_amount,
        "ship_base_id": storage.ship_base_id,
        "name": storage.base_resource.name,
        "category": storage.base_resource.category,
        "unit": storage.base_resource.unit,
        "min_threshold": storage.base_resource.min_threshold,
    }


@router.get("/{base_id}/storage", response_model=List[BaseStorageResponse])
async def list_base_storage(
    base_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Listar todos los recursos en el almacén de una nave."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")

    storage = (
        db.query(BaseStorage)
        .options(joinedload(BaseStorage.base_resource))
        .filter(BaseStorage.ship_base_id == base_id)
        .all()
    )
    return [serialize_base_storage(s) for s in storage]


@router.get("/{base_id}/storage/{storage_id}", response_model=BaseStorageResponse)
async def get_base_storage(
    base_id: UUID,
    storage_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtener detalles de un recurso en el almacén."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")

    storage = (
        db.query(BaseStorage)
        .options(joinedload(BaseStorage.base_resource))
        .filter(BaseStorage.id == storage_id, BaseStorage.ship_base_id == base_id)
        .first()
    )
    if not storage:
        raise HTTPException(status_code=404, detail="Recurso de almacén no encontrado")
    return serialize_base_storage(storage)


@router.patch("/{base_id}/storage/{storage_id}", response_model=BaseStorageResponse)
async def update_base_storage(
    base_id: UUID,
    storage_id: UUID,
    current_amount: float,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Actualizar la cantidad de un recurso en el almacén."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")

    storage = (
        db.query(BaseStorage)
        .options(joinedload(BaseStorage.base_resource))
        .filter(BaseStorage.id == storage_id, BaseStorage.ship_base_id == base_id)
        .first()
    )
    if not storage:
        raise HTTPException(status_code=404, detail="Recurso de almacén no encontrado")

    storage.current_amount = current_amount
    db.commit()
    db.refresh(storage)
    return serialize_base_storage(storage)


@router.post("/{base_id}/storage/{storage_id}/logs", response_model=ResourceLogResponse, status_code=status.HTTP_201_CREATED)
async def add_base_storage_log(
    base_id: UUID,
    storage_id: UUID,
    log: ResourceLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Registrar un movimiento de recurso en el almacén."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")

    storage = (
        db.query(BaseStorage)
        .options(joinedload(BaseStorage.base_resource))
        .filter(BaseStorage.id == storage_id, BaseStorage.ship_base_id == base_id)
        .first()
    )
    if not storage:
        raise HTTPException(status_code=404, detail="Recurso de almacén no encontrado")

    if log.type == ResourceLogType.INTAKE:
        storage.current_amount += log.amount
    else:
        storage.current_amount = max(0, storage.current_amount - log.amount)

    db_log = ResourceLog(
        base_storage_id=storage_id,
        type=log.type,
        amount=log.amount,
        reason=log.reason,
        trip_id=log.trip_id,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/{base_id}/storage/{storage_id}/logs", response_model=List[ResourceLogResponse])
async def list_base_storage_logs(
    base_id: UUID,
    storage_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Listar movimientos de un recurso en el almacén."""
    ship_base = db.query(ShipBase).filter(ShipBase.id == base_id).first()
    if not ship_base:
        raise HTTPException(status_code=404, detail="Base de nave no encontrada")

    storage = (
        db.query(BaseStorage)
        .filter(BaseStorage.id == storage_id, BaseStorage.ship_base_id == base_id)
        .first()
    )
    if not storage:
        raise HTTPException(status_code=404, detail="Recurso de almacén no encontrado")

    return (
        db.query(ResourceLog)
        .filter(ResourceLog.base_storage_id == storage_id)
        .order_by(ResourceLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
