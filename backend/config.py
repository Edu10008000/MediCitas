"""
config.py — Configuración con Pydantic Settings

FIXES:
- SECRET_KEY tiene default seguro (no "CHANGE_ME" vacío que rompía JWT)
- ALLOWED_ORIGINS incluye localhost:5174 (Vite segundo puerto) y :3000 (CRA)
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base de datos
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "consultorio_medico"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # JWT — cambia esto en producción con: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "medicitas-dev-secret-key-ujat-dacti-2025-please-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Entorno
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://127.0.0.1:3000,"
        "http://127.0.0.1:5173"
    )

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
