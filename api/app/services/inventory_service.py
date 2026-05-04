from sqlalchemy.orm import Session
import uuid

from app.core.constants import DEFAULT_USER_RESOURCE_AMOUNTS


def initialize_user_inventory(db: Session, user_id: uuid.UUID) -> None:
    from app.models.base_resource import BaseResource
    from app.models.inventory_resource import InventoryResource

    base_resources = db.query(BaseResource).all()
    for base_res in base_resources:
        amount = DEFAULT_USER_RESOURCE_AMOUNTS.get(base_res.name, 0.0)
        resource = InventoryResource(
            base_resource_id=base_res.id,
            current_amount=amount,
            user_id=user_id,
        )
        db.add(resource)
    db.commit()
