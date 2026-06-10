-- ============================================================
-- Sistema de Gestión de Citas Médicas - Cunduacán, Tabasco
-- Script de Base de Datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS consultorio_medico
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE consultorio_medico;

-- ============================================================
-- TABLA: Roles
-- ============================================================
CREATE TABLE Roles (
    id          INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion TEXT,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Roles (nombre, descripcion) VALUES
    ('paciente',        'Ciudadano que agenda citas médicas'),
    ('doctor',          'Médico / Administrador de consultorio'),
    ('superadmin',      'Administrador global del sistema');

-- ============================================================
-- TABLA: Especialidades
-- ============================================================
CREATE TABLE Especialidades (
    id          INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono       VARCHAR(80)  DEFAULT 'stethoscope',
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Especialidades (nombre, descripcion, icono) VALUES
    ('Medicina General',    'Atención médica primaria y preventiva',         'stethoscope'),
    ('Pediatría',           'Atención médica para niños y adolescentes',     'baby'),
    ('Ginecología',         'Salud femenina y reproductiva',                 'heart'),
    ('Odontología',         'Salud bucal y dental',                         'smile'),
    ('Dermatología',        'Enfermedades de la piel',                      'shield'),
    ('Cardiología',         'Enfermedades del corazón',                     'activity'),
    ('Traumatología',       'Lesiones y enfermedades del sistema motor',    'bone'),
    ('Nutrición',           'Orientación nutricional y dietética',          'leaf');

-- ============================================================
-- TABLA: Usuarios
-- ============================================================
CREATE TABLE Usuarios (
    id                  INT          NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    telefono            VARCHAR(20),
    fecha_nacimiento    DATE,
    rol_id              INT          NOT NULL,
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion       DATETIME,
    PRIMARY KEY (id),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES Roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Super-administrador por defecto (password: Admin1234!)
-- Hash generado con bcrypt en la aplicación
INSERT INTO Usuarios (nombre, apellido, email, password_hash, rol_id) VALUES
    ('Super', 'Administrador', 'admin@consultorio.mx',
     '$2b$12$placeholder_hash_change_on_first_run', 3);

-- ============================================================
-- TABLA: Consultorios
-- ============================================================
CREATE TABLE Consultorios (
    id                  INT          NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150) NOT NULL,
    direccion           TEXT         NOT NULL,
    colonia             VARCHAR(100),
    telefono            VARCHAR(20),
    especialidad_id     INT,
    doctor_id           INT,
    latitud             DECIMAL(10,8),
    longitud            DECIMAL(11,8),
    estado              ENUM('Abierto','Cerrado') NOT NULL DEFAULT 'Abierto',
    nivel_saturacion    ENUM('Baja','Media','Alta') NOT NULL DEFAULT 'Baja',
    capacidad_diaria    INT          NOT NULL DEFAULT 20,
    descripcion         TEXT,
    activo              BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_consultorio_especialidad FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id) ON UPDATE CASCADE,
    CONSTRAINT fk_consultorio_doctor       FOREIGN KEY (doctor_id)       REFERENCES Usuarios(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Consultorios de muestra (Cunduacán)
INSERT INTO Consultorios (nombre, direccion, colonia, especialidad_id, latitud, longitud) VALUES
    ('Farmacias Similares - Sucursal Centro',
     'Av. Periférico 106', 'Col. Centro', 1, 18.0330, -93.1650),
    ('Unidad Médica Atenas',
     'Av. Pedro Méndez 361', 'Col. Centro', 1, 18.0325, -93.1640),
    ('Consultorio Dr. Herrera García',
     'Av. Fidencia Fernández Sastre 10', 'Col. Centro', 2, 18.0320, -93.1635),
    ('Centro de Salud Francisco Sánchez Presenda',
     'Calle Miguel Hidalgo y Costilla No. 3', 'Col. Centro', 1, 18.0315, -93.1645);

-- ============================================================
-- TABLA: Horarios
-- ============================================================
CREATE TABLE Horarios (
    id              INT  NOT NULL AUTO_INCREMENT,
    consultorio_id  INT  NOT NULL,
    dia_semana      ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
    hora_inicio     TIME NOT NULL,
    hora_fin        TIME NOT NULL,
    duracion_cita   INT  NOT NULL DEFAULT 30,   -- minutos por cita
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_horario_consultorio FOREIGN KEY (consultorio_id) REFERENCES Consultorios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLA: Citas
-- Control de concurrencia: UNIQUE KEY en (consultorio_id, fecha, hora)
-- garantiza que dos pacientes NO puedan agendar el mismo slot.
-- ============================================================
CREATE TABLE Citas (
    id                  INT          NOT NULL AUTO_INCREMENT,
    paciente_id         INT          NOT NULL,
    consultorio_id      INT          NOT NULL,
    fecha               DATE         NOT NULL,
    hora                TIME         NOT NULL,
    estado              ENUM('Pendiente','Confirmada','En_Espera','Atendida','Cancelada','No_Asistio')
                        NOT NULL DEFAULT 'Pendiente',
    motivo              VARCHAR(255),
    notas               TEXT,
    fecha_creacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Clave única: garantiza que no existan dos citas en el mismo consultorio, misma fecha y hora
    UNIQUE KEY uk_cita_slot (consultorio_id, fecha, hora),
    CONSTRAINT fk_cita_paciente    FOREIGN KEY (paciente_id)    REFERENCES Usuarios(id)     ON UPDATE CASCADE,
    CONSTRAINT fk_cita_consultorio FOREIGN KEY (consultorio_id) REFERENCES Consultorios(id) ON UPDATE CASCADE,
    INDEX idx_citas_paciente   (paciente_id),
    INDEX idx_citas_fecha      (fecha),
    INDEX idx_citas_estado     (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- VISTA: Saturación de consultorios (para actualización automática)
-- ============================================================
CREATE OR REPLACE VIEW v_saturacion_consultorios AS
SELECT
    c.id,
    c.nombre,
    c.capacidad_diaria,
    COUNT(ci.id)                                                            AS citas_hoy,
    ROUND(COUNT(ci.id) / c.capacidad_diaria * 100, 1)                     AS porcentaje_ocupacion,
    CASE
        WHEN COUNT(ci.id) / c.capacidad_diaria < 0.5  THEN 'Baja'
        WHEN COUNT(ci.id) / c.capacidad_diaria < 0.80 THEN 'Media'
        ELSE 'Alta'
    END                                                                     AS nivel_saturacion
FROM Consultorios c
LEFT JOIN Citas ci ON ci.consultorio_id = c.id
    AND ci.fecha = CURDATE()
    AND ci.estado NOT IN ('Cancelada','No_Asistio')
GROUP BY c.id, c.nombre, c.capacidad_diaria;

-- ============================================================
-- TRIGGER: Actualizar nivel_saturacion en Consultorios
-- al insertar o cambiar el estado de una cita
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_actualizar_saturacion_insert
AFTER INSERT ON Citas
FOR EACH ROW
BEGIN
    UPDATE Consultorios c
    JOIN v_saturacion_consultorios v ON v.id = c.id
    SET c.nivel_saturacion = v.nivel_saturacion
    WHERE c.id = NEW.consultorio_id;
END//

CREATE TRIGGER trg_actualizar_saturacion_update
AFTER UPDATE ON Citas
FOR EACH ROW
BEGIN
    UPDATE Consultorios c
    JOIN v_saturacion_consultorios v ON v.id = c.id
    SET c.nivel_saturacion = v.nivel_saturacion
    WHERE c.id = NEW.consultorio_id;
END//

DELIMITER ;
