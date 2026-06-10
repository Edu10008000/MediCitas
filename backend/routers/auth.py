"""
routers/auth.py — Endpoints de registro y login
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Roles que NO se pueden registrar públicamente
ROLES_BLOQUEADOS = {"superadmin", "admin"}


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registro público: solo permite 'paciente' o 'doctor'.
    El rol 'superadmin' nunca se puede registrar aquí.
    """
    # Seguridad: bloquear registro de admin por esta vía
    rol_solicitado = (data.rol or "paciente").lower()
    if rol_solicitado in ROLES_BLOQUEADOS:
        raise HTTPException(
            status_code=403,
            detail="No es posible registrarse con ese rol"
        )

    # Verificar email único
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    # Buscar el rol en la BD
    rol_obj = db.query(models.Rol).filter(models.Rol.nombre == rol_solicitado).first()
    if not rol_obj:
        raise HTTPException(
            status_code=400,
            detail=f"Rol '{rol_solicitado}' no encontrado. Usa 'paciente' o 'doctor'"
        )

    usuario = models.Usuario(
        nombre           = data.nombre.strip(),
        apellido         = data.apellido.strip(),
        email            = data.email.lower().strip(),
        password_hash    = hash_password(data.password),
        telefono         = data.telefono,
        fecha_nacimiento = data.fecha_nacimiento,
        rol_id           = rol_obj.id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    token = create_access_token({"sub": str(usuario.id)})
    return schemas.TokenResponse(
        access_token=token,
        rol=rol_obj.nombre,
        usuario_id=usuario.id,
        nombre=usuario.nombre,
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Login con email y contraseña. Devuelve JWT."""
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == data.email.lower().strip(),
        models.Usuario.activo == True,
    ).first()

    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    usuario.ultima_sesion = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": str(usuario.id)})
    return schemas.TokenResponse(
        access_token=token,
        rol=usuario.rol.nombre,
        usuario_id=usuario.id,
        nombre=usuario.nombre,
    )
