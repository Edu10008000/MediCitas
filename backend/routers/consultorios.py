"""
routers/consultorios.py — Consultorios, Especialidades y Horarios

NUEVO: 
- POST /consultorios → doctor crea su propio consultorio
- PUT /consultorios/{id} → doctor actualiza datos (incluyendo lat/lon para el mapa)
- DELETE /horarios/{id} → eliminar franja horaria
- GET /consultorios/{id}/citas-count → para el indicador de saturación
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, require_doctor, require_superadmin

router = APIRouter(tags=["Consultorios y Especialidades"])


# ══════════════════════════════════════════════════════════════════════════════
# ESPECIALIDADES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/especialidades", response_model=List[schemas.EspecialidadOut])
def listar_especialidades(db: Session = Depends(get_db)):
    return db.query(models.Especialidad).filter(models.Especialidad.activo == True).all()


# ══════════════════════════════════════════════════════════════════════════════
# CONSULTORIOS
# ══════════════════════════════════════════════════════════════════════════════

def _build_consultorio_out(c: models.Consultorio) -> schemas.ConsultorioOut:
    return schemas.ConsultorioOut(
        id=c.id,
        nombre=c.nombre,
        direccion=c.direccion,
        colonia=c.colonia,
        telefono=c.telefono,
        especialidad_id=c.especialidad_id,
        especialidad_nombre=c.especialidad.nombre if c.especialidad else None,
        doctor_id=c.doctor_id,
        doctor_nombre=(
            f"Dr. {c.doctor.nombre} {c.doctor.apellido}" if c.doctor else None
        ),
        latitud=float(c.latitud) if c.latitud is not None else None,
        longitud=float(c.longitud) if c.longitud is not None else None,
        estado=c.estado,
        nivel_saturacion=c.nivel_saturacion,
        capacidad_diaria=c.capacidad_diaria,
        descripcion=c.descripcion,
    )


@router.get("/consultorios", response_model=List[schemas.ConsultorioOut])
def listar_consultorios(
    especialidad_id: Optional[int] = Query(None),
    estado:          Optional[str] = Query(None),
    saturacion:      Optional[str] = Query(None),
    busqueda:        Optional[str] = Query(None),
    con_coordenadas: Optional[bool] = Query(None, description="Solo consultorios con lat/lon"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    ).filter(models.Consultorio.activo == True)

    if especialidad_id:
        query = query.filter(models.Consultorio.especialidad_id == especialidad_id)
    if estado:
        query = query.filter(models.Consultorio.estado == estado)
    if saturacion:
        query = query.filter(models.Consultorio.nivel_saturacion == saturacion)
    if busqueda:
        like = f"%{busqueda}%"
        query = query.filter(
            models.Consultorio.nombre.ilike(like) |
            models.Consultorio.direccion.ilike(like) |
            models.Consultorio.colonia.ilike(like)
        )
    if con_coordenadas:
        query = query.filter(
            models.Consultorio.latitud.isnot(None),
            models.Consultorio.longitud.isnot(None),
        )

    return [_build_consultorio_out(c) for c in query.all()]


@router.get("/consultorios/{consultorio_id}", response_model=schemas.ConsultorioOut)
def obtener_consultorio(
    consultorio_id: int,
    db: Session = Depends(get_db),
):
    c = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    ).filter(models.Consultorio.id == consultorio_id).first()

    if not c:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")
    return _build_consultorio_out(c)


@router.post("/consultorios", response_model=schemas.ConsultorioOut, status_code=201)
def crear_consultorio(
    data: schemas.ConsultorioCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    """
    El doctor crea su consultorio. Solo puede tener uno activo.
    El superadmin puede crear para cualquiera.
    """
    if current_user.rol.nombre == "doctor":
        existente = db.query(models.Consultorio).filter(
            models.Consultorio.doctor_id == current_user.id,
            models.Consultorio.activo == True,
        ).first()
        if existente:
            raise HTTPException(
                status_code=400,
                detail="Ya tienes un consultorio registrado. Edítalo en lugar de crear uno nuevo.",
            )

    c = models.Consultorio(
        nombre=data.nombre.strip(),
        direccion=data.direccion.strip(),
        colonia=data.colonia,
        telefono=data.telefono,
        especialidad_id=data.especialidad_id,
        doctor_id=current_user.id,
        latitud=data.latitud,
        longitud=data.longitud,
        descripcion=data.descripcion,
        capacidad_diaria=data.capacidad_diaria,
        estado="Abierto",
        nivel_saturacion="Baja",
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    # Recargar con relaciones
    c = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    ).filter(models.Consultorio.id == c.id).first()
    return _build_consultorio_out(c)


@router.put("/consultorios/{consultorio_id}", response_model=schemas.ConsultorioOut)
def actualizar_consultorio(
    consultorio_id: int,
    data: schemas.ConsultorioUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    """Actualiza datos del consultorio incluyendo lat/lon para el mapa."""
    c = db.query(models.Consultorio).filter(
        models.Consultorio.id == consultorio_id,
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")

    if current_user.rol.nombre == "doctor" and c.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado: este consultorio no es tuyo")

    campos = data.model_dump(exclude_unset=True)
    for k, v in campos.items():
        setattr(c, k, v)

    db.commit()
    db.refresh(c)

    c = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    ).filter(models.Consultorio.id == c.id).first()
    return _build_consultorio_out(c)


@router.patch("/consultorios/{consultorio_id}/estado")
def cambiar_estado_consultorio(
    consultorio_id: int,
    data: schemas.ConsultorioEstadoUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    c = db.query(models.Consultorio).filter(models.Consultorio.id == consultorio_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")
    if current_user.rol.nombre == "doctor" and c.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if data.estado not in ("Abierto", "Cerrado"):
        raise HTTPException(status_code=400, detail="Estado inválido. Usa 'Abierto' o 'Cerrado'")

    c.estado = data.estado
    db.commit()
    return {"mensaje": f"Consultorio '{c.nombre}' ahora está {c.estado}", "estado": c.estado}


@router.get("/consultorios/mi/consultorio", response_model=schemas.ConsultorioOut)
def mi_consultorio(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    """Devuelve el consultorio del doctor autenticado."""
    c = db.query(models.Consultorio).options(
        joinedload(models.Consultorio.especialidad),
        joinedload(models.Consultorio.doctor),
    ).filter(
        models.Consultorio.doctor_id == current_user.id,
        models.Consultorio.activo == True,
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="No tienes un consultorio registrado aún")
    return _build_consultorio_out(c)


# ══════════════════════════════════════════════════════════════════════════════
# HORARIOS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/consultorios/{consultorio_id}/horarios", response_model=List[schemas.HorarioOut])
def listar_horarios(
    consultorio_id: int,
    db: Session = Depends(get_db),
):
    return db.query(models.Horario).filter(
        models.Horario.consultorio_id == consultorio_id,
    ).all()


@router.post("/consultorios/{consultorio_id}/horarios", response_model=schemas.HorarioOut, status_code=201)
def crear_horario(
    consultorio_id: int,
    data: schemas.HorarioCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    c = db.query(models.Consultorio).filter(models.Consultorio.id == consultorio_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")
    if current_user.rol.nombre == "doctor" and c.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Verificar que no existe ya ese día
    existente = db.query(models.Horario).filter(
        models.Horario.consultorio_id == consultorio_id,
        models.Horario.dia_semana == data.dia_semana,
        models.Horario.activo == True,
    ).first()
    if existente:
        # Actualizar en lugar de duplicar
        existente.hora_inicio = data.hora_inicio
        existente.hora_fin = data.hora_fin
        existente.duracion_cita = data.duracion_cita
        db.commit()
        db.refresh(existente)
        return existente

    horario = models.Horario(
        consultorio_id=consultorio_id,
        dia_semana=data.dia_semana,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        duracion_cita=data.duracion_cita,
        activo=True,
    )
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/horarios/{horario_id}", status_code=204)
def eliminar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    h = db.query(models.Horario).filter(models.Horario.id == horario_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    # Verificar que el doctor es dueño
    if current_user.rol.nombre == "doctor":
        c = db.query(models.Consultorio).filter(
            models.Consultorio.id == h.consultorio_id,
            models.Consultorio.doctor_id == current_user.id,
        ).first()
        if not c:
            raise HTTPException(status_code=403, detail="No autorizado")

    db.delete(h)
    db.commit()
