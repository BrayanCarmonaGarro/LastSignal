# Variables de entorno
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://admin:secret@db:5432/lastsignal"
    keycloak_url: str = "http://keycloak:8080"
    keycloak_realm: str = "lastsignal"
    keycloak_client_id: str = "lastsignal-api"
    keycloak_client_secret: str = "changeme"
    ai_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()