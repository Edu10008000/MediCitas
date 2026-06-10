"""
routers/admin.py — Endpoints de administración (SuperAdmin) + CU17
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from ..auth import require_superadmin, hash_password

router = APIRouter(prefix="/admin", tags=["Administración"])


# ─── CU17: Gestionar consultorios alta/baja ──────────────────────────────────

@router.get("/consultorios", response_model=List[schemas.ConsultorioOut])
def admin_listar_consultorios(
    activo: bool = Query(None),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    q = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    )
    if activo is not None:
        q = q.filter(models.Consultorio.activo == activo)
    cs = q.all()
    result = []
    for c in cs:
        result.append(schemas.ConsultorioOut(
            id=c.id, nombre=c.nombre, direccion=c.direccion, colonia=c.colonia,
            telefono=c.telefono, especialidad_id=c.especialidad_id,
            especialidad_nombre=c.especialidad.nombre if c.especialidad else None,
            doctor_id=c.doctor_id,
            doctor_nombre=f"Dr. {c.doctor.nombre} {c.doctor.apellido}" if c.doctor else None,
            latitud=float(c.latitud) if c.latitud else None,
            longitud=float(c.longitud) if c.longitud else None,
            estado=c.estado, nivel_saturacion=c.nivel_saturacion,
            capacidad_diaria=c.capacidad_diaria, descripcion=c.descripcion,
        ))
    return result


@router.patch("/consultorios/{consultorio_id}/activar")
def admin_activar_consultorio(
    consultorio_id: int,
    activo: bool,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    """CU17: Alta/baja de consultorio por el superadmin."""
    c = db.query(models.Consultorio).filter(models.Consultorio.id == consultorio_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")

    if not activo:
        # Verificar citas futuras
        from datetime import date as ddate
        citas_futuras = db.query(func.count(models.Cita.id)).filter(
            models.Cita.consultorio_id == consultorio_id,
            models.Cita.fecha >= ddate.today(),
            models.Cita.estado.notin_(["Cancelada", "Atendida", "No_Asistio"]),
        ).scalar()
        if citas_futuras > 0:
            raise HTTPException(
                status_code=400,
                detail=f"El consultorio tiene {citas_futuras} cita(s) futuras activas. Cancélalas antes de darlo de baja."
            )

    c.activo = activo
    db.commit()
    return {"mensaje": f"Consultorio {'activado' if activo else 'desactivado'} correctamente", "activo": activo}


# ─── Gestión de usuarios ──────────────────────────────────────────────────────

@router.get("/usuarios", response_model=List[schemas.UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    usuarios = db.query(models.Usuario).options(joinedload(models.Usuario.rol)).all()
    return [schemas.UsuarioOut(
        id=u.id, nombre=u.nombre, apellido=u.apellido, email=u.email,
        telefono=u.telefono, rol=u.rol.nombre, activo=u.activo,
        fecha_registro=u.fecha_registro,
    ) for u in usuarios]


@router.post("/doctores", response_model=schemas.UsuarioOut, status_code=201)
def crear_doctor(
    data: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    rol_doctor = db.query(models.Rol).filter(models.Rol.nombre == "doctor").first()
    doctor = models.Usuario(
        nombre=data.nombre, apellido=data.apellido, email=data.email,
        password_hash=hash_password(data.password), telefono=data.telefono,
        fecha_nacimiento=data.fecha_nacimiento, rol_id=rol_doctor.id,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return schemas.UsuarioOut(
        id=doctor.id, nombre=doctor.nombre, apellido=doctor.apellido,
        email=doctor.email, telefono=doctor.telefono, rol="doctor",
        activo=doctor.activo, fecha_registro=doctor.fecha_registro,
    )


@router.patch("/usuarios/{usuario_id}/activar")
def activar_usuario(
    usuario_id: int,
    activo: bool,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    u = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.activo = activo
    db.commit()
    return {"mensaje": f"Usuario {'activado' if activo else 'desactivado'}"}


# ─── CU16: Reportes estadísticos ─────────────────────────────────────────────

@router.get("/reportes/estadisticas", response_model=schemas.ReporteStats)
def estadisticas(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_superadmin),
):
    today = date.today()

    total_usuarios     = db.query(func.count(models.Usuario.id)).scalar()
    total_pacientes    = db.query(func.count(models.Usuario.id)).join(models.Rol).filter(models.Rol.nombre == "paciente").scalar()
    total_doctores     = db.query(func.count(models.Usuario.id)).join(models.Rol).filter(models.Rol.nombre == "doctor").scalar()
    total_consultorios = db.query(func.count(models.Consultorio.id)).filter(models.Consultorio.activo == True).scalar()
    total_citas_hoy    = db.query(func.count(models.Cita.id)).filter(models.Cita.fecha == today).scalar()
    total_citas_mes    = db.query(func.count(models.Cita.id)).filter(
        func.month(models.Cita.fecha) == today.month,
        func.year(models.Cita.fecha) == today.year,
    ).scalar()

    estados_raw = db.query(models.Cita.estado, func.count(models.Cita.id)).group_by(models.Cita.estado).all()
    sat_raw     = db.query(models.Consultorio.nivel_saturacion, func.count(models.Consultorio.id)).group_by(models.Consultorio.nivel_saturacion).all()

    return schemas.ReporteStats(
        total_usuarios=total_usuarios, total_pacientes=total_pacientes,
        total_doctores=total_doctores, total_consultorios=total_consultorios,
        total_citas_hoy=total_citas_hoy, total_citas_mes=total_citas_mes,
        citas_por_estado={e: c for e, c in estados_raw},
        consultorios_saturacion={s: c for s, c in sat_raw},
    )
