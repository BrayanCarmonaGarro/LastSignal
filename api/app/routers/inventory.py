# app/routers/inventory.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.inventory_resource import InventoryResource
from app.models.base_resource import BaseResource
from app.models.resource_log import ResourceLog, ResourceLogType
from app.schemas.inventory_resource import (
    InventoryResourceCreate,
    InventoryResourceUpdate,
    InventoryResourceResponse,
)
from app.schemas.resource import (
    ResourceLogCreate,
    ResourceLogResponse,
    BaseResourceResponse,
)

router = APIRouter(prefix="/inventory", tags=["Inventario"])


def load_inventory_with_base(db: Session, resource_id: UUID, user_id: UUID):
    """Helper para cargar un inventory_resource con su base_resource en un solo query."""
    return (
        db.query(InventoryResource)
        .options(joinedload(InventoryResource.base_resource))
        .filter(InventoryResource.id == resource_id, InventoryResource.user_id == user_id)
        .first()
    )


def serialize_inventory(inventory: InventoryResource) -> dict:
    """Aplana los campos de base_resource en el response."""
    return {
        "id": inventory.id,
        "base_resource_id": inventory.base_resource_id,
        "current_amount": inventory.current_amount,
        "user_id": inventory.user_id,
        "name": inventory.base_resource.name,
        "category": inventory.base_resource.category,
        "unit": inventory.base_resource.unit,
        "min_threshold": inventory.base_resource.min_threshold,
        "is_critical": inventory.base_resource.is_critical,
    }


@router.get("", response_model=List[InventoryResourceResponse])
async def list_inventory(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = (
        db.query(InventoryResource)
        .options(joinedload(InventoryResource.base_resource))
        .filter(InventoryResource.user_id == user.id)
        .all()
    )
    return [serialize_inventory(r) for r in inventory]


@router.get("/below-threshold", response_model=List[InventoryResourceResponse])
async def list_inventory_below_threshold(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = (
        db.query(InventoryResource)
        .options(joinedload(InventoryResource.base_resource))
        .filter(InventoryResource.user_id == user.id)
        .all()
    )
    return [
        serialize_inventory(r)
        for r in inventory
        if r.current_amount <= r.base_resource.min_threshold
    ]


@router.get("/base-resources", response_model=List[BaseResourceResponse])
async def list_base_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(BaseResource).order_by(BaseResource.name).all()


@router.post("", response_model=InventoryResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item: InventoryResourceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    base = db.query(BaseResource).filter(BaseResource.id == item.base_resource_id).first()
    if not base:
        raise HTTPException(status_code=404, detail="Recurso base no encontrado")

    db_item = InventoryResource(
        base_resource_id=item.base_resource_id,
        current_amount=item.current_amount,
        user_id=user.id,
    )
    db.add(db_item)
    db.commit()

    return serialize_inventory(
        db.query(InventoryResource)
        .options(joinedload(InventoryResource.base_resource))
        .filter(InventoryResource.id == db_item.id)
        .first()
    )


@router.get("/{inventory_id}", response_model=InventoryResourceResponse)
async def get_inventory_item(
    inventory_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = load_inventory_with_base(db, inventory_id, user.id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return serialize_inventory(inventory)


@router.patch("/{inventory_id}", response_model=InventoryResourceResponse)
async def update_inventory_item(
    inventory_id: UUID,
    data: InventoryResourceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = load_inventory_with_base(db, inventory_id, user.id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inventory, field, value)

    db.commit()
    return serialize_inventory(load_inventory_with_base(db, inventory_id, user.id))


@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(
    inventory_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = (
        db.query(InventoryResource)
        .filter(InventoryResource.id == inventory_id, InventoryResource.user_id == user.id)
        .first()
    )
    if not inventory:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    db.delete(inventory)
    db.commit()


@router.post(
    "/{inventory_id}/logs",
    response_model=ResourceLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_inventory_log(
    inventory_id: UUID,
    log: ResourceLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = load_inventory_with_base(db, inventory_id, user.id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    if log.type == ResourceLogType.INTAKE:
        inventory.current_amount += log.amount
    else:
        inventory.current_amount = max(0, inventory.current_amount - log.amount)

    db_log = ResourceLog(
        inventory_resource_id=inventory_id,
        type=log.type,
        amount=log.amount,
        reason=log.reason,
        trip_id=log.trip_id,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/{inventory_id}/logs", response_model=List[ResourceLogResponse])
async def list_inventory_logs(
    inventory_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    inventory = (
        db.query(InventoryResource)
        .filter(InventoryResource.id == inventory_id, InventoryResource.user_id == user.id)
        .first()
    )
    if not inventory:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return (
        db.query(ResourceLog)
        .filter(ResourceLog.inventory_resource_id == inventory_id)
        .order_by(ResourceLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
