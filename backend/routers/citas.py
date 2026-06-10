"""
routers/citas.py — Endpoints de Citas (CU06–CU11, CU14–CU15, CU18)
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, require_paciente, require_doctor

router = APIRouter(prefix="/citas", tags=["Citas"])


def _build_cita_out(c: models.Cita) -> schemas.CitaOut:
    return schemas.CitaOut(
        id=c.id,
        paciente_id=c.paciente_id,
        paciente_nombre=f"{c.paciente.nombre} {c.paciente.apellido}" if c.paciente else None,
        consultorio_id=c.consultorio_id,
        consultorio_nombre=c.consultorio.nombre if c.consultorio else None,
        consultorio_direccion=c.consultorio.direccion if c.consultorio else None,
        fecha=c.fecha,
        hora=c.hora,
        estado=c.estado,
        motivo=c.motivo,
        notas=c.notas,
        fecha_creacion=c.fecha_creacion,
    )


# ─── GET /citas ───────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.CitaOut])
def listar_citas(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin:    Optional[date] = Query(None),
    estado:       Optional[str]  = Query(None),
    db:           Session        = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    query = db.query(models.Cita).options(
        joinedload(models.Cita.paciente),
        joinedload(models.Cita.consultorio),
    )

    rol = current_user.rol.nombre
    if rol == "paciente":
        query = query.filter(models.Cita.paciente_id == current_user.id)
    elif rol == "doctor":
        consultorio = db.query(models.Consultorio).filter(
            models.Consultorio.doctor_id == current_user.id
        ).first()
        if not consultorio:
            return []
        query = query.filter(models.Cita.consultorio_id == consultorio.id)

    if fecha_inicio:
        query = query.filter(models.Cita.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.Cita.fecha <= fecha_fin)
    if estado:
        query = query.filter(models.Cita.estado == estado)

    citas = query.order_by(models.Cita.fecha.desc(), models.Cita.hora).all()
    return [_build_cita_out(c) for c in citas]


# ─── POST /citas — Agendar (CU06) ────────────────────────────────────────────

@router.post("/", response_model=schemas.CitaOut, status_code=201)
def agendar_cita(
    data:         schemas.CitaCreate,
    db:           Session        = Depends(get_db),
    current_user: models.Usuario = Depends(require_paciente),
):
    consultorio = db.query(models.Consultorio).filter(
        models.Consultorio.id == data.consultorio_id,
        models.Consultorio.activo == True,
    ).first()

    if not consultorio:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")
    if consultorio.estado == "Cerrado":
        raise HTTPException(status_code=400, detail="El consultorio está cerrado en este momento")

    # Verificar doble cita del mismo paciente ese slot
    cita_existente = db.query(models.Cita).filter(
        models.Cita.paciente_id == current_user.id,
        models.Cita.fecha == data.fecha,
        models.Cita.hora == data.hora,
        models.Cita.estado.notin_(["Cancelada", "No_Asistio"]),
    ).first()
    if cita_existente:
        raise HTTPException(
            status_code=400,
            detail="Ya tienes una cita agendada para esa fecha y hora",
        )

    nueva_cita = models.Cita(
        paciente_id    = current_user.id,
        consultorio_id = data.consultorio_id,
        fecha          = data.fecha,
        hora           = data.hora,
        motivo         = data.motivo,
        estado         = "Pendiente",
    )
    db.add(nueva_cita)

    try:
        db.commit()
        db.refresh(nueva_cita)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese horario ya fue tomado por otro paciente. Por favor elige otro.",
        )

    # Recargar con relaciones
    cita = db.query(models.Cita).options(
        joinedload(models.Cita.paciente),
        joinedload(models.Cita.consultorio),
    ).filter(models.Cita.id == nueva_cita.id).first()
    return _build_cita_out(cita)


# ─── PATCH /citas/{id}/estado — Cancelar/Confirmar (CU07, CU08) ──────────────

@router.patch("/{cita_id}/estado", response_model=schemas.CitaOut)
def actualizar_estado_cita(
    cita_id:      int,
    data:         schemas.CitaEstadoUpdate,
    db:           Session        = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    cita = db.query(models.Cita).options(
        joinedload(models.Cita.paciente),
        joinedload(models.Cita.consultorio),
    ).filter(models.Cita.id == cita_id).first()

    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # Validar que la cita no esté ya atendida o cancelada
    if cita.estado == "Atendida":
        raise HTTPException(status_code=400, detail="No se puede modificar una cita que ya fue atendida")

    rol = current_user.rol.nombre
    if rol == "paciente":
        if cita.paciente_id != current_user.id:
            raise HTTPException(status_code=403, detail="No autorizado")
        if data.estado != "Cancelada":
            raise HTTPException(status_code=403, detail="El paciente solo puede cancelar citas")
    elif rol == "doctor":
        consultorio = db.query(models.Consultorio).filter(
            models.Consultorio.doctor_id == current_user.id
        ).first()
        if not consultorio or cita.consultorio_id != consultorio.id:
            raise HTTPException(status_code=403, detail="No autorizado")

    cita.estado = data.estado
    db.commit()
    db.refresh(cita)
    return _build_cita_out(cita)


# ─── PATCH /citas/{id}/notas — Agregar nota (CU15) ───────────────────────────

@router.patch("/{cita_id}/notas", response_model=schemas.CitaOut)
def agregar_nota(
    cita_id:      int,
    data:         schemas.CitaNotaUpdate,
    db:           Session        = Depends(get_db),
    current_user: models.Usuario = Depends(require_doctor),
):
    """El doctor agrega una nota clínica a la cita (solo escritura, sin edición posterior)."""
    cita = db.query(models.Cita).options(
        joinedload(models.Cita.paciente),
        joinedload(models.Cita.consultorio),
    ).filter(models.Cita.id == cita_id).first()

    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if current_user.rol.nombre == "doctor":
        consultorio = db.query(models.Consultorio).filter(
            models.Consultorio.doctor_id == current_user.id
        ).first()
        if not consultorio or cita.consultorio_id != consultorio.id:
            raise HTTPException(status_code=403, detail="No autorizado")

    if cita.notas:
        raise HTTPException(
            status_code=400,
            detail="Las notas ya están registradas. Crea una nueva cita si necesitas agregar más información."
        )

    cita.notas = data.notas
    db.commit()
    db.refresh(cita)
    return _build_cita_out(cita)


# ─── GET /citas/slots-disponibles (CU06) ─────────────────────────────────────

@router.get("/slots-disponibles")
def slots_disponibles(
    consultorio_id: int,
    fecha:          date,
    db:             Session        = Depends(get_db),
    _:              models.Usuario = Depends(get_current_user),
):
    from datetime import datetime, timedelta

    horarios = db.query(models.Horario).filter(
        models.Horario.consultorio_id == consultorio_id,
        models.Horario.activo == True,
    ).all()

    dias_map = {
        "Monday": "Lunes", "Tuesday": "Martes", "Wednesday": "Miércoles",
        "Thursday": "Jueves", "Friday": "Viernes", "Saturday": "Sábado", "Sunday": "Domingo",
    }
    dia_semana = dias_map[fecha.strftime("%A")]

    horario_dia = next((h for h in horarios if h.dia_semana == dia_semana), None)
    if not horario_dia:
        return {"fecha": str(fecha), "dia": dia_semana, "slots": [], "mensaje": f"El consultorio no atiende los {dia_semana}"}

    inicio = datetime.combine(fecha, horario_dia.hora_inicio)
    fin    = datetime.combine(fecha, horario_dia.hora_fin)
    delta  = timedelta(minutes=horario_dia.duracion_cita)

    todos_slots = []
    actual = inicio
    while actual + delta <= fin:
        todos_slots.append(actual.time())
        actual += delta

    ocupados = {
        c.hora for c in db.query(models.Cita).filter(
            models.Cita.consultorio_id == consultorio_id,
            models.Cita.fecha == fecha,
            models.Cita.estado.notin_(["Cancelada", "No_Asistio"]),
        ).all()
    }

    disponibles = [s.strftime("%H:%M") for s in todos_slots if s not in ocupados]
    return {
        "fecha": str(fecha),
        "dia": dia_semana,
        "slots": disponibles,
        "total_slots": len(todos_slots),
        "ocupados": len(ocupados),
    }
