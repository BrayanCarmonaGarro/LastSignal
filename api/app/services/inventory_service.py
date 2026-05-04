from sqlalchemy.orm import Session
import uuid

DEFAULT_RESOURCE_AMOUNTS: dict[str, float] = {
    "Oxígeno":        100.0,
    "Agua":           100.0,
    "Raciones":       3000.0,
    "Combustible":    18.0,
    "Botiquín":       2.0,
    "Baterías":       4.0,
    "Píldoras Radio": 3.0,
}


def initialize_user_inventory(db: Session, user_id: uuid.UUID) -> None:
    from app.models.base_resource import BaseResource
    from app.models.inventory_resource import InventoryResource

    base_resources = db.query(BaseResource).all()
    for base_res in base_resources:
        amount = DEFAULT_RESOURCE_AMOUNTS.get(base_res.name, 0.0)
        resource = InventoryResource(
            base_resource_id=base_res.id,
            current_amount=amount,
            user_id=user_id,
        )
        db.add(resource)
    db.commit()
