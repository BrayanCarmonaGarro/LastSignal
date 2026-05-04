# Importar todos los modelos para que SQLAlchemy los registre al crear las tablas
from app.models.user import User
from app.models.logbook import LogbookEntry, LifeFormSearch
from app.models.inventory_resource import InventoryResource
from app.models.resource_log import ResourceLog
from app.models.trip import Trip
from app.models.trip_waypoint import TripWaypoint
from app.models.trip_danger_zone import TripDangerZone
from app.models.supply_drop import SupplyDrop
from app.models.supply_drop_item import SupplyDropItem
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.base_resource import BaseResource
from app.models.ship_base import ShipBase
from app.models.base_storage import BaseStorage