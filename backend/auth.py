"""
auth.py — Autenticación JWT y utilidades de contraseña

FIX CRÍTICO: passlib[bcrypt] es incompatible con bcrypt >= 4.x porque
la nueva versión eliminó el atributo `__about__.__version__`.
Solución: usar bcrypt directamente sin passlib.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Contraseñas (bcrypt directo, sin passlib) ───────────────────────────────

def hash_password(password: str) -> str:
    """Genera hash bcrypt. Trunca a 72 bytes (límite del algoritmo)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica contraseña contra hash almacenado."""
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ─── Tokens JWT ───────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── Dependencias de autenticación ───────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(models.Usuario).filter(
        models.Usuario.id == int(user_id),
        models.Usuario.activo == True,
    ).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return user


def require_role(*roles: str):
    def _checker(current_user: models.Usuario = Depends(get_current_user)):
        if current_user.rol.nombre not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos roles: {', '.join(roles)}",
            )
        return current_user
    return _checker


require_paciente       = require_role("paciente")
require_doctor         = require_role("doctor", "superadmin")
require_superadmin     = require_role("superadmin")
require_authenticated  = require_role("paciente", "doctor", "superadmin")
