from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.user import User
from app.schemas.user import UserResponse, UsernameSetRequest

router = APIRouter(prefix="/users", tags=["Users"])


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
