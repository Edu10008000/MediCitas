# 🏥 Sistema de Gestión de Citas Médicas — Cunduacán, Tabasco

> Proyecto académico — Ingeniería de Software · UJAT DACTI  
> Autores: De La Cruz Contreras Eduardo · García García Abdiel

---

## Tabla de contenidos
1. [Descripción general](#descripción-general)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación de la base de datos](#1-base-de-datos-mysql)
5. [Instalación del backend](#2-backend-fastapi)
6. [Instalación del frontend](#3-frontend-react)
7. [Roles y accesos](#roles-y-accesos)
8. [Funcionalidades por rol](#funcionalidades-por-rol)
9. [Seguridad y concurrencia](#seguridad-y-concurrencia)
10. [Guía de la API](#guía-de-la-api-fastapi-docs)

---

## Descripción general

Sistema web de citas médicas en línea que permite a ciudadanos del municipio de Cunduacán agendar consultas médicas, visualizar la saturación de los consultorios en tiempo real y evitar filas presenciales.

---

## Arquitectura del proyecto

```
consultorio-medico/
├── database/
│   └── schema.sql          ← Esquema MySQL (tablas, triggers, vistas)
├── backend/                ← API REST (Python + FastAPI)
│   ├── main.py
│   ├── config.py
│   ├── database.py         ← Conexión SQLAlchemy
│   ├── models.py           ← Modelos ORM
│   ├── schemas.py          ← Validación Pydantic
│   ├── auth.py             ← JWT + bcrypt
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py         ← /api/auth/register, /api/auth/login
│       ├── citas.py        ← /api/citas  (con control de concurrencia)
│       ├── consultorios.py ← /api/consultorios, /api/especialidades
│       └── admin.py        ← /api/admin  (superadmin)
└── frontend/               ← App React + Tailwind CSS
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                  ← Router + rutas protegidas
        ├── api/client.js            ← Axios con interceptores JWT
        ├── contexts/AuthContext.jsx ← Estado global de autenticación
        ├── components/Navbar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Dashboard/
                ├── index.jsx           ← Switch por rol
                ├── PatientDashboard.jsx
                ├── DoctorDashboard.jsx
                └── AdminDashboard.jsx
```

---

## Requisitos previos

| Software       | Versión mínima | Descarga |
|----------------|---------------|----------|
| Python         | 3.11+         | https://python.org |
| Node.js        | 18+           | https://nodejs.org |
| MySQL Server   | 8.0+          | https://dev.mysql.com/downloads/ |
| npm            | 9+            | Incluido con Node.js |

---

## 1. Base de datos (MySQL)

### Crear la base de datos

Abre tu cliente MySQL (MySQL Workbench, terminal, DBeaver, etc.) y ejecuta:

```sql
-- Opción A: desde la terminal de MySQL
mysql -u root -p < database/schema.sql

-- Opción B: pegando el contenido directamente en MySQL Workbench
```

Esto crea la base de datos `consultorio_medico` con todas las tablas, relaciones, triggers y datos de ejemplo.

### Verificar la instalación

```sql
USE consultorio_medico;
SHOW TABLES;
-- Debe mostrar: Citas, Consultorios, Especialidades, Horarios, Roles, Usuarios
```

---

## 2. Backend (FastAPI)

### Paso 1: Crear el entorno virtual

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Paso 2: Instalar dependencias

```bash
pip install -r requirements.txt
```

### Paso 3: Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus datos reales:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# SECRET_KEY  ← Cámbiala por una cadena aleatoria larga (mínimo 32 chars)
```

Ejemplo de `.env` completo:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=consultorio_medico
DB_USER=root
DB_PASSWORD=miPasswordMySQL

SECRET_KEY=unaClaveSecretaMuyLargaYSegura1234567890abcdef
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
```

### Paso 4: Iniciar el servidor

```bash
# Desde la carpeta raíz del proyecto (un nivel arriba de /backend)
uvicorn backend.main:app --reload --port 8000
```

El servidor quedará en: **http://localhost:8000**  
Documentación interactiva: **http://localhost:8000/docs**

---

## 3. Frontend (React)

### Paso 1: Instalar dependencias

```bash
cd frontend
npm install
```

### Paso 2: Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación quedará en: **http://localhost:5173**

> El frontend está configurado para hacer proxy automático de `/api` hacia `http://localhost:8000`, así que no necesitas configurar CORS manualmente en desarrollo.

### Paso 3 (Producción): Generar build

```bash
npm run build
# Los archivos estáticos quedan en /frontend/dist
# Sírvelos con Nginx, Apache, o cualquier CDN
```

---

## Roles y accesos

| Rol          | Cómo se crea                          | Email por defecto              |
|--------------|---------------------------------------|-------------------------------|
| Paciente     | Registro público en `/register`       | —                             |
| Doctor       | Creado por el SuperAdmin desde el panel | —                            |
| SuperAdmin   | Insertado en el schema SQL             | `admin@consultorio.mx`        |

> ⚠️ **Importante**: Cambia la contraseña del SuperAdmin inmediatamente después de la primera instalación usando el endpoint `POST /api/auth/login` y luego actualizando el hash en la BD.

---

## Funcionalidades por rol

### 🧑 Paciente
- Registro e inicio de sesión
- Buscar consultorios por especialidad, nombre o nivel de saturación
- Ver indicadores de saturación en tiempo real (🟢 Baja / 🟡 Media / 🔴 Alta)
- Agendar cita en **3 pasos**: Elige consultorio → Elige fecha y hora → Confirma
- Ver y cancelar sus citas

### 👨‍⚕️ Doctor / Admin de Consultorio
- Ver las citas de su consultorio
- Cambiar el estado de citas (Pendiente → En Espera → Atendida)
- Abrir o cerrar su consultorio (cambia visibilidad para pacientes)
- Gestionar horarios de atención por día de la semana

### ⚙️ Super Administrador
- Ver estadísticas del sistema (usuarios, citas, saturación)
- Crear y gestionar cuentas de doctores
- Activar / desactivar usuarios
- Ver todos los usuarios del sistema

---

## Seguridad y concurrencia

### Autenticación JWT
Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```
El token se obtiene al hacer login y expira en 8 horas (configurable).

### Control de concurrencia (anti-doble agendamiento)
El sistema implementa **dos capas** de protección:

1. **Capa de aplicación (Python):** Verifica antes de insertar si el slot ya está ocupado.
2. **Capa de base de datos (MySQL):** La tabla `Citas` tiene un `UNIQUE KEY (consultorio_id, fecha, hora)`. Si dos peticiones simultáneas llegan al mismo milisegundo, MySQL rechaza la segunda con un `IntegrityError`, que FastAPI captura y devuelve como HTTP **409 Conflict**.

---

## Guía de la API (FastAPI Docs)

Con el servidor corriendo, visita **http://localhost:8000/docs** para la documentación interactiva Swagger.

### Endpoints principales

| Método | Ruta                                  | Rol requerido | Descripción                          |
|--------|---------------------------------------|---------------|--------------------------------------|
| POST   | `/api/auth/register`                  | Público       | Registro de paciente                |
| POST   | `/api/auth/login`                     | Público       | Login, devuelve JWT                 |
| GET    | `/api/consultorios`                   | Público       | Lista consultorios con filtros      |
| GET    | `/api/especialidades`                 | Público       | Lista especialidades                |
| GET    | `/api/citas`                          | Autenticado   | Lista citas (filtrado por rol)      |
| POST   | `/api/citas`                          | Paciente      | **Agendar cita** (control concurrencia) |
| GET    | `/api/citas/slots-disponibles`        | Autenticado   | Horarios libres de un consultorio   |
| PATCH  | `/api/citas/{id}/estado`              | Doctor/Paciente | Cambiar estado de una cita        |
| PATCH  | `/api/consultorios/{id}/estado`       | Doctor        | Abrir/cerrar consultorio            |
| POST   | `/api/consultorios/{id}/horarios`     | Doctor        | Agregar horario de atención         |
| GET    | `/api/admin/reportes/estadisticas`    | SuperAdmin    | Estadísticas del sistema            |
| POST   | `/api/admin/doctores`                 | SuperAdmin    | Crear cuenta de doctor              |
| GET    | `/api/admin/usuarios`                 | SuperAdmin    | Listar todos los usuarios           |

---

## Solución de problemas comunes

| Problema | Solución |
|----------|----------|
| `Connection refused` al iniciar backend | Verifica que MySQL esté corriendo y que `.env` tenga los datos correctos |
| `ModuleNotFoundError` | Asegúrate de tener el entorno virtual activado y haber ejecutado `pip install -r requirements.txt` |
| Frontend no conecta con el backend | Verifica que el backend esté en el puerto 8000 y que `vite.config.js` tenga el proxy configurado |
| Error 401 en todas las peticiones | El token JWT expiró. Vuelve a iniciar sesión |
| Error 409 al agendar | El horario fue tomado por otro usuario en ese instante. Elige otro horario |

---

## Tecnologías utilizadas

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Python + FastAPI | 3.11 / 0.111 |
| ORM | SQLAlchemy | 2.0 |
| Validación | Pydantic v2 | 2.7 |
| Autenticación | python-jose (JWT) + passlib (bcrypt) | 3.3 / 1.7 |
| Base de datos | MySQL | 8.0 |
| Frontend | React + Vite | 18 / 5 |
| Estilos | Tailwind CSS | 3.4 |
| HTTP Client | Axios | 1.7 |
| Routing | React Router v6 | 6.23 |
