# api/app/core/config.py
from pydantic_settings import BaseSettings


UPLOAD_DIR = "imagenes_guardadas"

class Settings(BaseSettings):
    database_url: str
    keycloak_url: str
    keycloak_realm: str
    keycloak_client_id: str
    keycloak_client_secret: str
    ai_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()