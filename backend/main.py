"""
main.py — Punto de entrada FastAPI — MediCitas v2
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .database import engine, Base, SessionLocal
from .routers import auth, citas, consultorios, admin

# Crear tablas si no existen (dev)
Base.metadata.create_all(bind=engine)


def seed_datos_iniciales():
    """Inserta datos mínimos necesarios al arrancar. Idempotente."""
    from . import models
    from .auth import hash_password

    db: Session = SessionLocal()
    try:
        # Roles
        for nombre, desc in [
            ("paciente",   "Usuario que agenda citas médicas"),
            ("doctor",     "Médico o representante de consultorio"),
            ("superadmin", "Administrador global del sistema"),
        ]:
            if not db.query(models.Rol).filter(models.Rol.nombre == nombre).first():
                db.add(models.Rol(nombre=nombre, descripcion=desc))
        db.commit()

        # Especialidades
        especialidades = [
            ("Medicina General", "Atención primaria y preventiva", "stethoscope"),
            ("Pediatría",        "Atención para niños y adolescentes", "baby"),
            ("Ginecología",      "Salud femenina y reproductiva", "heart"),
            ("Odontología",      "Salud bucal y dental", "smile"),
            ("Dermatología",     "Enfermedades de la piel", "shield"),
            ("Cardiología",      "Enfermedades del corazón", "activity"),
            ("Traumatología",    "Lesiones del sistema motor", "bone"),
            ("Nutrición",        "Orientación nutricional", "leaf"),
        ]
        for nombre, desc, icono in especialidades:
            if not db.query(models.Especialidad).filter(models.Especialidad.nombre == nombre).first():
                db.add(models.Especialidad(nombre=nombre, descripcion=desc, icono=icono, activo=True))
        db.commit()

        # Superadmin por defecto (solo si no existe)
        rol_sa = db.query(models.Rol).filter(models.Rol.nombre == "superadmin").first()
        if rol_sa and not db.query(models.Usuario).filter(models.Usuario.email == "admin@medicitas.mx").first():
            db.add(models.Usuario(
                nombre="Super", apellido="Admin",
                email="admin@medicitas.mx",
                password_hash=hash_password("Admin1234!"),
                rol_id=rol_sa.id, activo=True,
            ))
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[SEED] Error (ignorado): {e}")
    finally:
        db.close()


seed_datos_iniciales()

app = FastAPI(
    title="API - MediCitas Cunduacán",
    description="Sistema de Gestión de Citas Médicas — UJAT DACYTI",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api"
app.include_router(auth.router,         prefix=API)
app.include_router(citas.router,        prefix=API)
app.include_router(consultorios.router, prefix=API)
app.include_router(admin.router,        prefix=API)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "version": "2.0.0", "servicio": "MediCitas API — Cunduacán"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
