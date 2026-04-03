# Lógica de sincronización
from typing import List
from sqlalchemy.orm import Session
from app.models.logbook import LogbookEntry, LifeFormCategory, DangerLevel, SyncStatus
from app.models.resource import Resource, ResourceCategory, ResourceUnit
from app.models.resource_log import ResourceLog, ResourceLogType


def process_sync_operations(operations: List[dict], user_id: str, db: Session) -> dict:
    """
    Procesa operaciones pendientes enviadas desde el dispositivo offline.
    Cada operación tiene: entity, action, data, local_id
    Retorna un resumen de procesadas y fallidas.
    """
    processed = []
    failed = []

    for op in operations:
        try:
            entity = op.get("entity")
            action = op.get("action")
            data = op.get("data", {})
            local_id = op.get("local_id")

            if entity == "logbook_entry" and action == "create":
                _sync_create_logbook_entry(data, user_id, db)
                processed.append({"local_id": local_id, "status": "synced"})

            elif entity == "resource_log" and action == "create":
                _sync_create_resource_log(data, user_id, db)
                processed.append({"local_id": local_id, "status": "synced"})

            else:
                processed.append({"local_id": local_id, "status": "synced"})

        except Exception as e:
            failed.append({"local_id": op.get("local_id"), "error": str(e)})

    db.commit()
    return {"processed": processed, "failed": failed, "total": len(operations)}


def _sync_create_logbook_entry(data: dict, user_id: str, db: Session):
    entry = LogbookEntry(
        photo_url=data.get("photo_url", ""),
        description=data.get("description", ""),
        classification=LifeFormCategory(
            data.get("classification", "UNKNOWN_ORGANISM")
        ),
        danger_level=DangerLevel(data.get("danger_level", "UNKNOWN")),
        sync_status=SyncStatus.SYNCED,
        user_id=user_id,
    )
    db.add(entry)


def _sync_create_resource_log(data: dict, user_id: str, db: Session):
    log = ResourceLog(
        resource_id=data.get("resource_id"),
        type=ResourceLogType(data.get("type", "EXPENSE")),
        amount=float(data.get("amount", 0)),
        reason=data.get("reason"),
    )
    db.add(log)