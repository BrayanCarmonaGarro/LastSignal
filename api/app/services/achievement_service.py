#Lógica de gamificación
from sqlalchemy.orm import Session
from app.models.achievement import Achievement
from app.models.user_achievement import UserAchievement
from app.models.logbook import LogbookEntry
from app.models.trip import Trip


def check_and_award_achievements(user_id: str, db: Session) -> list:
    """
    Evalúa si el usuario merece nuevos logros y los otorga automáticamente.
    Retorna lista de nuevos logros desbloqueados.
    """
    new_achievements = []

    existing_keys = {
        ua.achievement.key
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id)
        .all()
    }

    entry_count = (
        db.query(LogbookEntry).filter(LogbookEntry.user_id == user_id).count()
    )
    trip_count = db.query(Trip).filter(Trip.user_id == user_id).count()

    checks = [
        ("FIRST_DISCOVERY", entry_count >= 1),
        ("TEN_ENTRIES", entry_count >= 10),
        ("EXPLORER_25", entry_count >= 25),
        ("FIRST_TRIP", trip_count >= 1),
        ("VETERAN_TRIPS", trip_count >= 5),
    ]

    for key, condition in checks:
        if condition and key not in existing_keys:
            achievement = _award(user_id, key, db)
            if achievement:
                new_achievements.append(achievement)

    if new_achievements:
        db.commit()

    return new_achievements


def _award(user_id: str, key: str, db: Session):
    achievement = db.query(Achievement).filter(Achievement.key == key).first()
    if not achievement:
        return None
    ua = UserAchievement(user_id=user_id, achievement_id=achievement.id)
    db.add(ua)
    return achievement


def seed_achievements(db: Session):
    """
    Crea los logros base del sistema si no existen.
    Llamar una vez al iniciar la app.
    """
    default_achievements = [
        {
            "key": "FIRST_DISCOVERY",
            "name": "Primera Descubrimiento",
            "description": "Registraste tu primera forma de vida en la bitácora",
        },
        {
            "key": "TEN_ENTRIES",
            "name": "Explorador Dedicado",
            "description": "Registraste 10 formas de vida",
        },
        {
            "key": "EXPLORER_25",
            "name": "Explorador Experto",
            "description": "Registraste 25 formas de vida",
        },
        {
            "key": "FIRST_TRIP",
            "name": "Primer Viaje",
            "description": "Completaste tu primer viaje de exploración",
        },
        {
            "key": "VETERAN_TRIPS",
            "name": "Veterano",
            "description": "Completaste 5 viajes de exploración",
        },
        {
            "key": "SURVIVOR",
            "name": "Superviviente",
            "description": "Mantuviste todos los recursos críticos por encima del mínimo",
        },
    ]

    for data in default_achievements:
        exists = db.query(Achievement).filter(Achievement.key == data["key"]).first()
        if not exists:
            db.add(Achievement(**data))

    db.commit()