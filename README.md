# Aplicación de Gestión de Inscripciones y Tutorías

Este proyecto es una aplicación web completa (frontend + backend) para gestionar:

- **Tutores/usuarios** (registro y login).
- **Talleres** (actividades a las que se pueden apuntar).
- **Inscripciones** de participantes a talleres.
- **Pagos simulados** de inscripciones.
- **Asistencia** a talleres.
- **Reportes descargables** (CSV) de inscripciones, asistencia y pagos.

Está pensada para ejecutarse en tu propio ordenador en modo desarrollo y no requiere que tengas experiencia previa con esta aplicación concreta.

---

## 1. Estructura general del proyecto

En la carpeta raíz (`EJERCICIO 1`) tienes:

```text
EJERCICIO 1/
├─ backend/                  # Servidor Node.js + Express
│  ├─ server.js              # Puntos de entrada de la API (tutores, talleres, inscripciones, reportes, etc.)
│  ├─ db.js                  # Conexión a la base de datos
│  ├─ .env                   # Variables de entorno (puerto, conexión BD, JWT_SECRET, etc.)
│  ├─ package.json           # Dependencias y scripts del backend
│  └─ ...
│
├─ frontend/                 # Aplicación web en React
│  ├─ src/
│  │  ├─ App.js              # Orquestación principal (login, registro, panel tutor)
│  │  ├─ components/
│  │  │  ├─ Login.js         # Pantalla de inicio de sesión
│  │  │  ├─ Register.js      # Pantalla de registro de nuevo tutor/usuario
│  │  │  ├─ InscripcionForm.js   # Formulario para crear nuevas inscripciones
│  │  │  └─ InscripcionesTutor.js # Listado de inscripciones del tutor (pagar, cancelar, ver estado)
│  │  └─ ...
│  ├─ public/
│  ├─ package.json           # Dependencias y scripts del frontend
│  └─ ...
│
├─ Análisis funcional y de requisitos.docx
├─ Diseño y propuesta.docx
├─ Historias de Usuario.docx
└─ ...
```

---

## 2. Requisitos previos

1. **Node.js y npm** instalados.
   - Comprueba en una terminal:
     ```bash
     node -v
     npm -v
     ```
   - Si no aparecen versiones, instala Node.js desde:
     - https://nodejs.org

2. Recomendado:
   - **Visual Studio Code** u otro editor de código.
   - Navegador moderno (Chrome, Edge, Firefox).

---

## 3. Backend: configuración y arranque

### 3.1. Variables de entorno (`backend/.env`)

En el archivo `.env` del backend se configuran cosas como:

- Puerto del servidor (por defecto en el código se usa `3000` si no hay env).
- Datos de conexión a la base de datos.
- Clave JWT (`JWT_SECRET`).

Ejemplo (no es tu configuración real, solo una guía):

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_basededatos
JWT_SECRET=loqueseaSuperSeguro
```

Ajusta estos valores según tu entorno.

### 3.2. Instalar dependencias del backend

En una terminal, desde la carpeta raíz del proyecto:

```bash
cd backend
npm install
```

### 3.3. Arrancar el backend

```bash
cd backend
node server.js
```

- Levanta el servidor Express.
- Escucha (según `PORT` o por defecto) en algo como:
  - `http://localhost:3000`

Endpoints principales (todos bajo `http://localhost:3000`):

- Autenticación y tutores:
  - `POST /api/tutores/register`
  - `POST /api/auth/login`
- Talleres:
  - `POST /api/talleres`
  - `GET  /api/talleres`
- Inscripciones:
  - `POST /api/inscripciones`
  - `GET  /api/inscripciones/:tallerId`
  - `GET  /api/inscripciones/tutor/:tutorId` (protegido con JWT)
  - `PUT  /api/inscripciones/:id/cancelar` (protegido)
  - `PUT  /api/inscripciones/:id/pagar` (protegido)
- Asistencia:
  - `POST /api/asistencia`
  - `GET  /api/asistencia/:tallerId`
- Reportes:
  - `GET /api/reportes/inscripciones/:tallerId`  (CSV)
  - `GET /api/reportes/asistencia/:tallerId`     (CSV)
  - `GET /api/reportes/pagos`                    (CSV)

---

## 4. Frontend: configuración y arranque

### 4.1. Instalar dependencias del frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
npm install
```

### 4.2. Arrancar el frontend

```bash
cd frontend
npm start
```

- Levanta la app de React en modo desarrollo.
- Se abre (o puedes abrirla) en:
  - `http://localhost:3000` (si el backend también usa 3000, puedes cambiar uno de los puertos en `.env` o en la configuración de React/Express).

**Nota:** El código actual llama al backend en `http://localhost:3000/...`.  
Si cambias el puerto del backend, asegúrate de actualizar las URLs en el frontend (por ejemplo, a `http://localhost:3001/api/...`).

---

## 5. Flujo de uso de la aplicación

### 5.1. Registro de nuevo usuario (tutor)

Desde el navegador:

1. Ve a `http://localhost:3000`.
2. Verás la pantalla principal con el **Login**.
3. Haz clic en **“Registrarme”**.
4. Se abre el formulario de registro (`Register.js`):
   - Nombre
   - Apellido
   - Email
   - Teléfono (opcional)
   - Contraseña (mínimo 6 caracteres)
   - Repetir contraseña
5. Envía el formulario.
   - Si todo va bien:
     - Se crea un nuevo tutor en la tabla `tutores`.
     - Aparece un mensaje indicando que puedes iniciar sesión.
   - El backend usa:
     - `POST /api/tutores/register`.

Al completar el registro, vuelves a la pantalla de login.

### 5.2. Login

1. En la pantalla de inicio (`Login.js`), introduce:
   - Email
   - Contraseña
2. Envía el formulario.
3. Si las credenciales son correctas:
   - El backend genera un JWT con:
     - `POST /api/auth/login`
   - El frontend guarda:
     - El token en `localStorage`.
     - Los datos del usuario (tutor) en estado.
   - La interfaz cambia al **panel de tutor**.

### 5.3. Panel de tutor

Una vez logueado (`App.js`):

- Verás:
  - Botón **“Cerrar sesión”**.
  - Mensaje: `Bienvenido, {nombre_del_tutor}`.
  - Formulario **“Nueva inscripción”** (`InscripcionForm`).
  - Tabla **“Mis inscripciones”** (`InscripcionesTutor`).

---

## 6. Gestión de talleres y plazas

### 6.1. Talleres disponibles

En el formulario de **Nueva inscripción** se carga la lista de talleres con:

- `GET /api/talleres`

Cada taller se muestra como:

```text
Nombre del taller (ocupadas/cupo_maximo plazas)
```

Por ejemplo:

- `Taller de Robótica Básica (2/20 plazas)`
- `Taller de Arte y Creatividad (0/15 plazas)`

Esto significa:

- `ocupadas`: número de inscripciones activas (no canceladas) a ese taller.
- `cupo_maximo`: número máximo de plazas definidas para ese taller.

Cada vez que creas una inscripción nueva:

1. El backend guarda la inscripción en `inscripciones` (estado inicial pendiente).
2. El formulario vuelve a pedir `GET /api/talleres`.
3. El backend recalcula cuántas plazas ocupadas tiene cada taller.
4. El selector se actualiza y muestra el nuevo número de plazas ocupadas.

---

## 7. Crear una nueva inscripción

En el panel de tutor:

1. En la sección **“Nueva inscripción”**:
   - Rellena:
     - Nombre del participante.
     - Apellido del participante.
     - Fecha de nacimiento (no puede ser posterior al día de hoy).
     - Taller (se selecciona del desplegable con plazas `/cupo`).
2. Envía el formulario:
   - El frontend hace `POST /api/inscripciones` con:
     - Datos del participante.
     - `tutor_id` (ID del tutor logueado).
   - El backend valida:
     - Fecha de nacimiento (no futura).
     - Cupo del taller (no sobrepasar `cupo_maximo`).
     - Que el mismo participante no esté ya inscrito en ese taller para ese tutor.
3. Si la inscripción es correcta:
   - Muestra mensaje de éxito.
   - Limpia el formulario.
   - Actualiza automáticamente:
     - La lista de talleres (ocupación).
     - La tabla de **“Mis inscripciones”** del tutor, que se refresca y enseña la nueva inscripción, permitiendo pagarla o cancelarla al momento.

---

## 8. Mis inscripciones: ver, pagar y cancelar

En el panel de tutor, la tabla **“Mis inscripciones”** (`InscripcionesTutor`) muestra:

- Nombre y apellidos del participante.
- Fecha de nacimiento.
- Taller.
- Fechas del taller (inicio y fin).
- Fecha de inscripción.
- Estado:
  - `pendiente`
  - `pagado`
  - `cancelada`
- Acciones:
  - **Cancelar** (si no está ya cancelada).
  - **Pagar** (si no está cancelada ni pagada).

### 8.1. Cancelar inscripción

- Botón **“Cancelar”**:
  - Hace `PUT /api/inscripciones/:id/cancelar` con token JWT.
  - Backend marca la inscripción como `cancelada`.
  - La tabla actualiza el estado a `Cancelada`.

### 8.2. Marcar como pagada

- Botón **“Pagar”**:
  - Hace `PUT /api/inscripciones/:id/pagar` con token JWT.
  - El backend:
    - Cambia el estado a `pagado`.
    - Inserta un registro en la tabla de `pagos` con un pago simulado.
  - La tabla actualiza el estado a `Pagado`.

---

## 9. Asistencia a talleres

Hay endpoints para registrar y consultar asistencia:

- `POST /api/asistencia`
- `GET  /api/asistencia/:tallerId`

Esto permite:

- Registrar si un participante estuvo presente un día concreto para un taller.
- Consultar el histórico de asistencia de un taller (participante, fecha, comentarios, etc.).

La lógica está implementada en `backend/server.js` y se puede consumir desde herramientas externas (Postman, etc.) o extender el frontend con nuevas pantallas si lo necesitas.

---

## 10. Reportes y descarga de ficheros CSV

La aplicación genera **reportes en formato CSV** desde el backend. Estos ficheros pueden abrirse con Excel, LibreOffice, Google Sheets, etc.

### 10.1. Reporte de inscripciones por taller

Endpoint:

```http
GET http://localhost:3000/api/reportes/inscripciones/:tallerId
```

- Sustituye `:tallerId` por el ID real del taller (por ejemplo, `1`).
- El backend devuelve un fichero CSV con columnas como:
  - `id_inscripcion`
  - `participante_nombre`
  - `participante_apellido`
  - `fecha_nacimiento`
  - `taller`
  - `nombre_tutor`
  - `apellido_tutor`
  - `email_tutor`
  - `fecha_inscripcion`
  - `estado`

**Cómo descargarlo fácilmente:**

1. Asegúrate de que el backend está arrancado.
2. Abre el navegador.
3. Escribe la URL, p. ej.:
   - `http://localhost:3000/api/reportes/inscripciones/1`
4. El navegador descargará automáticamente un archivo con nombre:
   - `reporte_inscripciones_taller_1.csv`
5. Ábrelo con Excel, LibreOffice o similar.

### 10.2. Reporte de asistencia por taller

Endpoint:

```http
GET http://localhost:3000/api/reportes/asistencia/:tallerId
```

- De nuevo, sustituye `:tallerId` por el ID de tu taller.

Contenido típico del CSV:

- `fecha`
- `participante_nombre`
- `participante_apellido`
- `fecha_nacimiento`
- `presente` (true/false)
- `comentarios`
- `taller`

**Descarga:**

1. Backend en marcha.
2. Navegador → URL tipo:
   - `http://localhost:3000/api/reportes/asistencia/1`
3. Se descargará un archivo:
   - `reporte_asistencia_taller_1.csv`

### 10.3. Reporte de pagos

Endpoint:

```http
GET http://localhost:3000/api/reportes/pagos
```

Contenido típico:

- `id_pago`
- `fecha_pago`
- `monto`
- `metodo`
- `status`
- `referencia`
- `id_inscripcion`
- `taller`
- `nombre_tutor`
- `apellido_tutor`
- `email_tutor`

**Descarga:**

1. Backend en marcha.
2. Navegador → URL:
   - `http://localhost:3000/api/reportes/pagos`
3. Se descargará un archivo:
   - `reporte_pagos.csv`

---

## 11. Resumen de flujo completo

1. **Arrancar backend**:
   - `cd backend`
   - `npm install` (primera vez)
   - `npm start`

2. **Arrancar frontend**:
   - `cd frontend`
   - `npm install` (primera vez)
   - `npm start`

3. **Registrar tutor** desde la web:
   - `http://localhost:3000` → “Registrarme” → formulario → alta correcta.

4. **Login**:
   - `http://localhost:3000` → introducir credenciales → entrar al panel.

5. **Crear inscripciones**:
   - Elegir taller (viendo `ocupadas/cupo`).
   - Rellenar datos del participante.
   - Enviar → inscripción se crea, ocupación y lista del tutor se actualizan.

6. **Gestionar inscripciones**:
   - Ver tus inscripciones en la tabla.
   - Pagar o cancelar según sea necesario.

7. **Descargar reportes**:
   - Inscripciones por taller:  
     `http://localhost:3000/api/reportes/inscripciones/:tallerId`
   - Asistencia por taller:  
     `http://localhost:3000/api/reportes/asistencia/:tallerId`
   - Pagos:  
     `http://localhost:3000/api/reportes/pagos`

Con estos pasos, cualquier persona sin conocimiento previo de la aplicación debería poder:

- Instalar y arrancar el sistema.
- Registrarse y usar la interfaz para inscribir participantes.
- Ver y gestionar el estado de las inscripciones.
- Descargar ficheros de reporte en formato CSV para su análisis.
