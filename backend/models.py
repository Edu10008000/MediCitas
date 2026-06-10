"""
models.py — Modelos SQLAlchemy (mapeados a las tablas del schema.sql)
"""
from datetime import date, datetime, time
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, Time, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base


class Rol(Base):
    __tablename__ = "Roles"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(50), nullable=False, unique=True)
    descripcion = Column(Text)

    usuarios = relationship("Usuario", back_populates="rol")


class Especialidad(Base):
    __tablename__ = "Especialidades"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text)
    icono       = Column(String(80), default="stethoscope")
    activo      = Column(Boolean, default=True)

    consultorios = relationship("Consultorio", back_populates="especialidad")


class Usuario(Base):
    __tablename__ = "Usuarios"

    id               = Column(Integer, primary_key=True, index=True)
    nombre           = Column(String(100), nullable=False)
    apellido         = Column(String(100), nullable=False)
    email            = Column(String(150), nullable=False, unique=True, index=True)
    password_hash    = Column(String(255), nullable=False)
    telefono         = Column(String(20))
    fecha_nacimiento = Column(Date)
    rol_id           = Column(Integer, ForeignKey("Roles.id"), nullable=False)
    activo           = Column(Boolean, default=True)
    fecha_registro   = Column(DateTime, default=datetime.utcnow)
    ultima_sesion    = Column(DateTime)

    rol          = relationship("Rol", back_populates="usuarios")
    consultorios = relationship("Consultorio", back_populates="doctor")
    citas        = relationship("Cita", back_populates="paciente", foreign_keys="Cita.paciente_id")


class Consultorio(Base):
    __tablename__ = "Consultorios"

    id               = Column(Integer, primary_key=True, index=True)
    nombre           = Column(String(150), nullable=False)
    direccion        = Column(Text, nullable=False)
    colonia          = Column(String(100))
    telefono         = Column(String(20))
    especialidad_id  = Column(Integer, ForeignKey("Especialidades.id"))
    doctor_id        = Column(Integer, ForeignKey("Usuarios.id"))
    latitud          = Column(Numeric(10, 8))
    longitud         = Column(Numeric(11, 8))
    estado           = Column(Enum("Abierto", "Cerrado"), default="Abierto")
    nivel_saturacion = Column(Enum("Baja", "Media", "Alta"), default="Baja")
    capacidad_diaria = Column(Integer, default=20)
    descripcion      = Column(Text)
    activo           = Column(Boolean, default=True)
    fecha_registro   = Column(DateTime, default=datetime.utcnow)

    especialidad = relationship("Especialidad", back_populates="consultorios")
    doctor       = relationship("Usuario", back_populates="consultorios")
    horarios     = relationship("Horario", back_populates="consultorio", cascade="all, delete-orphan")
    citas        = relationship("Cita", back_populates="consultorio")


class Horario(Base):
    __tablename__ = "Horarios"

    id             = Column(Integer, primary_key=True, index=True)
    consultorio_id = Column(Integer, ForeignKey("Consultorios.id", ondelete="CASCADE"), nullable=False)
    dia_semana     = Column(
        Enum("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"),
        nullable=False
    )
    hora_inicio    = Column(Time, nullable=False)
    hora_fin       = Column(Time, nullable=False)
    duracion_cita  = Column(Integer, default=30)
    activo         = Column(Boolean, default=True)

    consultorio = relationship("Consultorio", back_populates="horarios")


class Cita(Base):
    __tablename__ = "Citas"
    __table_args__ = (
        # Control de concurrencia a nivel de BD:
        # imposible agendar dos citas en el mismo slot
        UniqueConstraint("consultorio_id", "fecha", "hora", name="uk_cita_slot"),
    )

    id                 = Column(Integer, primary_key=True, index=True)
    paciente_id        = Column(Integer, ForeignKey("Usuarios.id"), nullable=False, index=True)
    consultorio_id     = Column(Integer, ForeignKey("Consultorios.id"), nullable=False)
    fecha              = Column(Date, nullable=False, index=True)
    hora               = Column(Time, nullable=False)
    estado             = Column(
        Enum("Pendiente", "Confirmada", "En_Espera", "Atendida", "Cancelada", "No_Asistio"),
        default="Pendiente"
    )
    motivo             = Column(String(255))
    notas              = Column(Text)
    fecha_creacion     = Column(DateTime, default=datetime.utcnow)
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    paciente    = relationship("Usuario", back_populates="citas", foreign_keys=[paciente_id])
    consultorio = relationship("Consultorio", back_populates="citas")
