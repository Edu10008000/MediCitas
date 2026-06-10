"""
database.py — Conexión a MySQL con SQLAlchemy
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    "?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # Detecta conexiones muertas
    pool_recycle=3600,         # Recicla conexiones cada hora
    pool_size=10,
    max_overflow=20,
    echo=settings.ENVIRONMENT == "development",
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI: proporciona una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
