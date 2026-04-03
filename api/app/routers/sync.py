from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.services.sync_service import process_sync_operations

router = APIRouter(prefix="/sync", tags=["Sincronización"])


@router.post("")
async def sync_operations(
    operations: List[dict],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Recibe operaciones pendientes del dispositivo offline y las procesa.
    Cada operación: { entity, action, data, local_id }
    """
    user = await resolve_db_user(current_user, db)
    result = process_sync_operations(operations, str(user.id), db)
    return result