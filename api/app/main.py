from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.core.database import Base, engine, SessionLocal
from app.routers import achievements, logbook, resources, supply_drops, sync, trips, dashboard

import app.models  # noqa: F401 — registra todos los modelos en SQLAlchemy


def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as e:
        print(f"⚠️  No se pudieron crear las tablas: {e}")


def seed_data():
    try:
        db = SessionLocal()
        from app.services.achievement_service import seed_achievements
        seed_achievements(db)
        db.close()
    except Exception as e:
        print(f"⚠️  No se pudo ejecutar el seed: {e}")


create_tables()
seed_data()

app = FastAPI(
    title="LastSignal API",
    description="API de supervivencia espacial — Houston, tenemos un problema.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(logbook.router, prefix=PREFIX)
app.include_router(resources.router, prefix=PREFIX)
app.include_router(trips.router, prefix=PREFIX)
app.include_router(supply_drops.router, prefix=PREFIX)
app.include_router(achievements.router, prefix=PREFIX)
app.include_router(sync.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)


@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok", "version": "1.0.0"}