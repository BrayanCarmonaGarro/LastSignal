from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.resource import Resource
from app.models.resource_log import ResourceLog, ResourceLogType
from app.schemas.resource import (
    ResourceCreate,
    ResourceLogCreate,
    ResourceLogResponse,
    ResourceResponse,
    ResourceUpdate,
)

router = APIRouter(prefix="/resources", tags=["Recursos"])


@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return db.query(Resource).filter(Resource.user_id == user.id).all()


@router.get("/critical", response_model=List[ResourceResponse])
async def list_critical_resources(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return (
        db.query(Resource)
        .filter(Resource.user_id == user.id, Resource.is_critical == True)
        .all()
    )


@router.get("/alerts", response_model=List[ResourceResponse])
async def list_resources_below_threshold(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    resources = db.query(Resource).filter(Resource.user_id == user.id).all()
    return [r for r in resources if r.current_amount <= r.min_threshold]


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    db_resource = Resource(**resource.model_dump(), user_id=user.id)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
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
    return resource


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: UUID,
    data: ResourceUpdate,
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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


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
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id, Resource.user_id == user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    if log.type == ResourceLogType.INTAKE:
        resource.current_amount += log.amount
    else:
        resource.current_amount = max(0, resource.current_amount - log.amount)

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