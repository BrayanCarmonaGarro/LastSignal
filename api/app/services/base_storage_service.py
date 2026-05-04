import uuid
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_BASE_STORAGE_AMOUNTS


def initialize_base_storage(db: Session, ship_base_id: uuid.UUID) -> None:
    from app.models.base_resource import BaseResource
    from app.models.base_storage import BaseStorage

    base_resources = db.query(BaseResource).all()
    for base_res in base_resources:
        amount = DEFAULT_BASE_STORAGE_AMOUNTS.get(base_res.name, 0.0)
        storage = BaseStorage(
            base_resource_id=base_res.id,
            current_amount=amount,
            ship_base_id=ship_base_id,
        )
        db.add(storage)
    db.commit()
