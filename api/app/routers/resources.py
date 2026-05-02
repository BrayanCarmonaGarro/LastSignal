# app/routers/resources.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.resource import Resource
from app.models.base_resource import BaseResource
from app.models.resource_log import ResourceLog, ResourceLogType
from app.schemas.resource import (
    ResourceCreate,
    ResourceLogCreate,
    ResourceLogResponse,
    ResourceResponse,
    ResourceUpdate,
    BaseResourceResponse,
)

router = APIRouter(prefix="/resources", tags=["Recursos"])


def load_resource_with_base(db: Session, resource_id: UUID, user_id: UUID):
    """Helper para cargar un resource con su base_resource en un solo query."""
    return (
        db.query(Resource)
        .options(joinedload(Resource.base_resource))
        .filter(Resource.id == resource_id, Resource.user_id == user_id)
        .first()
    )


def serialize_resource(resource: Resource) -> dict:
    """Aplana los campos de base_resource en el response."""
    return {
        "id": resource.id,
        "base_resource_id": resource.base_resource_id,
        "current_amount": resource.current_amount,
        "is_critical": resource.is_critical,
        "user_id": resource.user_id,
        "name": resource.base_resource.name,
        "category": resource.base_resource.category,
        "unit": resource.base_resource.unit,
        "min_threshold": resource.base_resource.min_threshold,
    }


@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resources = (
        db.query(Resource)
        .options(joinedload(Resource.base_resource))
        .filter(Resource.user_id == user.id)
        .all()
    )
    return [serialize_resource(r) for r in resources]


@router.get("/critical", response_model=List[ResourceResponse])
async def list_critical_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resources = (
        db.query(Resource)
        .options(joinedload(Resource.base_resource))
        .filter(Resource.user_id == user.id, Resource.is_critical == True)
        .all()
    )
    return [serialize_resource(r) for r in resources]


@router.get("/alerts", response_model=List[ResourceResponse])
async def list_resources_below_threshold(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resources = (
        db.query(Resource)
        .options(joinedload(Resource.base_resource))
        .filter(Resource.user_id == user.id)
        .all()
    )
    return [
        serialize_resource(r)
        for r in resources
        if r.current_amount <= r.base_resource.min_threshold
    ]


@router.get("/base", response_model=List[BaseResourceResponse])
async def list_base_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(BaseResource).order_by(BaseResource.name).all()


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    base = db.query(BaseResource).filter(BaseResource.id == resource.base_resource_id).first()
    if not base:
        raise HTTPException(status_code=404, detail="Recurso base no encontrado")

    db_resource = Resource(
        base_resource_id=resource.base_resource_id,
        current_amount=resource.current_amount,
        is_critical=resource.current_amount <= base.min_threshold,
        user_id=user.id,
    )
    db.add(db_resource)
    db.commit()

    return serialize_resource(
        db.query(Resource)
        .options(joinedload(Resource.base_resource))
        .filter(Resource.id == db_resource.id)
        .first()
    )


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resource = load_resource_with_base(db, resource_id, user.id)
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return serialize_resource(resource)


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: UUID,
    data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resource = load_resource_with_base(db, resource_id, user.id)
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)

    # Recalcular is_critical automáticamente si cambió current_amount
    if "current_amount" in data.model_dump(exclude_unset=True):
        resource.is_critical = resource.current_amount <= resource.base_resource.min_threshold

    db.commit()
    return serialize_resource(load_resource_with_base(db, resource_id, user.id))


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id, Resource.user_id == user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    db.delete(resource)
    db.commit()


@router.post(
    "/{resource_id}/logs",
    response_model=ResourceLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_resource_log(
    resource_id: UUID,
    log: ResourceLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resource = load_resource_with_base(db, resource_id, user.id)
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    if log.type == ResourceLogType.INTAKE:
        resource.current_amount += log.amount
    else:
        resource.current_amount = max(0, resource.current_amount - log.amount)

    resource.is_critical = resource.current_amount <= resource.base_resource.min_threshold

    db_log = ResourceLog(resource_id=resource_id, **log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/{resource_id}/logs", response_model=List[ResourceLogResponse])
async def list_resource_logs(
    resource_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id, Resource.user_id == user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return (
        db.query(ResourceLog)
        .filter(ResourceLog.resource_id == resource_id)
        .order_by(ResourceLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )