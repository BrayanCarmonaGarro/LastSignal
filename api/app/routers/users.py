import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.user import User
from app.schemas.user import UserResponse, UsernameSetRequest, AddXpRequest

router = APIRouter(prefix="/users", tags=["Users"])

# ─── XP / Level helpers ───────────────────────────────────
MAX_LEVEL = 50

def get_xp_floor(level: int) -> int:
    n = max(1, min(level, MAX_LEVEL))
    return 0 if n <= 1 else math.floor(100 * math.pow(n - 1, 1.6))

def get_xp_ceiling(level: int) -> int:
    if level >= MAX_LEVEL:
        return get_xp_floor(MAX_LEVEL)
    return get_xp_floor(level + 1)

def compute_level_for_xp(xp: int) -> int:
    level = 1
    while level < MAX_LEVEL and xp >= get_xp_ceiling(level):
        level += 1
    return level

# ─── Endpoints ────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return UserResponse.model_validate(user)


@router.patch("/me/username", response_model=UserResponse)
async def set_username(
    body: UsernameSetRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    if not body.validate_format():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre de usuario solo puede contener letras, números y guiones bajos",
        )

    existing = db.query(User).filter(User.username == body.username, User.id != user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese nombre de usuario ya está en uso",
        )

    user.username = body.username
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/me/xp", response_model=UserResponse)
async def add_experience(
    body: AddXpRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    user.experience_pts += body.amount
    user.level = compute_level_for_xp(user.experience_pts)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)