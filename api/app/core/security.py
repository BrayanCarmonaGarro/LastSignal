# Validación tokens Keycloak
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import httpx

from app.core.config import settings

bearer_scheme = HTTPBearer()


async def get_keycloak_public_key() -> str:
    url = f"{settings.keycloak_url}/realms/{settings.keycloak_realm}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()["public_key"]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        public_key = await get_keycloak_public_key()
        pem_key = (
            f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"
        )
        payload = jwt.decode(
            token,
            pem_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


async def resolve_db_user(current_user: dict, db):
    """
    Dado el payload del token de Keycloak, busca o crea el usuario en PostgreSQL.
    Retorna el objeto User de la DB con su UUID real.
    """
    from app.models.user import User

    username = current_user.get("preferred_username")
    user = db.query(User).filter(User.username == username).first()

    if not user:
        user = User(
            username=username,
            password_hash="keycloak",
            display_name=current_user.get("name", username),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user