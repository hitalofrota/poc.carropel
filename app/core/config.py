# app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "POC Carropel"
    DATABASE_URL: str = "postgresql+psycopg2://admin:admin@db:5432/fastapi_poc"
    SECRET_KEY: str = "sua_chave_super_secreta"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 dia

    class Config:
        env_file = ".env"


settings_db = Settings()
