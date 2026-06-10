"""
schemas.py — Esquemas Pydantic completos para MediCitas
"""
from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator


# ─── AUTH ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    usuario_id: int
    nombre: str
    email: Optional[str] = None


# ─── USUARIOS ────────────────────────────────────────────────────────────────

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    rol: Optional[str] = "paciente"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe incluir al menos una letra mayúscula")
        return v

    @field_validator("rol", mode="before")
    @classmethod
    def rol_valido(cls, v) -> str:
        if not v:
            return "paciente"
        v = str(v).lower().strip()
        if v not in ("paciente", "doctor"):
            raise ValueError("El rol debe ser 'paciente' o 'doctor'")
        return v


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str]
    rol: str
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None


# ─── ESPECIALIDADES ──────────────────────────────────────────────────────────

class EspecialidadOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    icono: Optional[str]

    model_config = {"from_attributes": True}


# ─── CONSULTORIOS ────────────────────────────────────────────────────────────

class ConsultorioCreate(BaseModel):
    nombre: str
    direccion: str
    colonia: Optional[str] = None
    telefono: Optional[str] = None
    especialidad_id: Optional[int] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    descripcion: Optional[str] = None
    capacidad_diaria: int = 20


class ConsultorioUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    colonia: Optional[str] = None
    telefono: Optional[str] = None
    especialidad_id: Optional[int] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    descripcion: Optional[str] = None
    capacidad_diaria: Optional[int] = None


class ConsultorioOut(BaseModel):
    id: int
    nombre: str
    direccion: str
    colonia: Optional[str]
    telefono: Optional[str]
    especialidad_id: Optional[int]
    especialidad_nombre: Optional[str] = None
    doctor_id: Optional[int]
    doctor_nombre: Optional[str] = None
    latitud: Optional[float]
    longitud: Optional[float]
    estado: str
    nivel_saturacion: str
    capacidad_diaria: int
    descripcion: Optional[str]

    model_config = {"from_attributes": True}


class ConsultorioEstadoUpdate(BaseModel):
    estado: str   # "Abierto" | "Cerrado"


# ─── HORARIOS ────────────────────────────────────────────────────────────────

class HorarioCreate(BaseModel):
    dia_semana: str
    hora_inicio: time
    hora_fin: time
    duracion_cita: int = 30

    @field_validator("dia_semana")
    @classmethod
    def dia_valido(cls, v: str) -> str:
        validos = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"}
        if v not in validos:
            raise ValueError(f"dia_semana debe ser uno de: {', '.join(validos)}")
        return v


class HorarioOut(BaseModel):
    id: int
    dia_semana: str
    hora_inicio: time
    hora_fin: time
    duracion_cita: int
    activo: bool

    model_config = {"from_attributes": True}


# ─── CITAS ───────────────────────────────────────────────────────────────────

class CitaCreate(BaseModel):
    consultorio_id: int
    fecha: date
    hora: time
    motivo: Optional[str] = None

    @field_validator("fecha")
    @classmethod
    def fecha_futura(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("La fecha de la cita no puede ser en el pasado")
        return v


class CitaOut(BaseModel):
    id: int
    paciente_id: int
    paciente_nombre: Optional[str] = None
    consultorio_id: int
    consultorio_nombre: Optional[str] = None
    consultorio_direccion: Optional[str] = None
    fecha: date
    hora: time
    estado: str
    motivo: Optional[str]
    notas: Optional[str] = None
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


class CitaEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: str) -> str:
        validos = {"Pendiente", "Confirmada", "En_Espera", "Atendida", "Cancelada", "No_Asistio"}
        if v not in validos:
            raise ValueError(f"Estado inválido. Debe ser uno de: {', '.join(validos)}")
        return v


class CitaNotaUpdate(BaseModel):
    notas: str


# ─── REPORTES ────────────────────────────────────────────────────────────────

class ReporteStats(BaseModel):
    total_usuarios: int
    total_pacientes: int
    total_doctores: int
    total_consultorios: int
    total_citas_hoy: int
    total_citas_mes: int
    citas_por_estado: dict
    consultorios_saturacion: dict
