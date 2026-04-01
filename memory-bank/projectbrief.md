# Project Brief – Aplicación de Inscripción a Talleres

## 1. Visión general

Este proyecto es una aplicación web full‑stack (React + Node.js/Express) para gestionar **inscripciones a talleres de verano infantiles** por parte de tutores (padres/madres/tutores legales).

La aplicación permite a un tutor:

- Registrarse en la plataforma.
- Iniciar sesión de forma segura.
- Gestionar las inscripciones de sus hijos/hijas a distintos talleres.
- Consultar el estado de las inscripciones (pendiente, pagado, cancelada).
- Registrar pagos y cancelar inscripciones si es necesario.
- Visualizar información de plazas disponibles por taller.
- Descargar reportes en CSV de las inscripciones.

El objetivo principal es proporcionar una solución sencilla pero completa que cubra un flujo realista de gestión de inscripciones, sirviendo a la vez como ejercicio de desarrollo full‑stack, diseño de API REST, uso de JWT y aplicación de buenas prácticas de pruebas (plan de pruebas + tests unitarios).

---

## 2. Objetivos del proyecto

### 2.1 Objetivos funcionales

1. **Gestión de tutores**
   - Alta de nuevos tutores mediante formulario de registro.
   - Inicio de sesión con email y contraseña.
   - Validación de credenciales contra base de datos.
   - Emisión de token JWT para sesiones autenticadas.

2. **Gestión de inscripciones**
   - Listar inscripciones asociadas al tutor autenticado.
   - Crear nuevas inscripciones de participantes (niños/as) a talleres:
     - Datos mínimos: nombre, apellido, fecha de nacimiento, taller.
   - Validar reglas de negocio:
     - No permitir fecha de nacimiento futura.
     - No permitir inscribir dos veces al mismo participante en el mismo taller.
     - Respetar el cupo máximo del taller (plazas).
   - Actualizar estado de la inscripción:
     - `pendiente`
     - `pagado`
     - `cancelada`

3. **Gestión de talleres**
   - Listar talleres disponibles.
   - Calcular y exponer plazas ocupadas frente al cupo máximo.
   - Mostrar en frontend:
     - Nombre del taller.
     - Fechas de inicio/fin.
     - Plazas ocupadas / cupo.

4. **Pagos y cancelaciones**
   - Registrar un pago desde la interfaz de inscripciones del tutor.
   - Cambiar estado de inscripción de `pendiente` a `pagado`.
   - Cancelar una inscripción:
     - Solicitud de confirmación (diálogo).
     - Cambio de estado a `cancelada`.
     - Actualización de plazas disponibles.

5. **Reportes**
   - Generar un **reporte de inscripciones por taller** en formato CSV:
     - Endpoint backend que construye y devuelve el CSV.
     - Descarga desde el frontend.
   - Incluir en el CSV campos relevantes para gestión:
     - Taller, fechas, nombre participante, tutor, estado, etc.

6. **Pruebas**
   - Diseño de un plan de pruebas funcionales (documentado).
   - Implementación de una base de **tests unitarios** en frontend:
     - App.
     - Login.
     - Register.
     - Formulario de inscripción.
     - Lista de inscripciones del tutor.

---

### 2.2 Objetivos no funcionales

1. **Simplicidad de uso**
   - Interfaz clara y directa para tutores no técnicos.
   - Formularios con validaciones y mensajes de error entendibles.

2. **Seguridad básica**
   - Uso de JWT para proteger endpoints privados.
   - No exponer credenciales ni datos sensibles en el frontend.

3. **Calidad de código y mantenibilidad**
   - Separación clara frontend / backend.
   - Código organizado por componentes en React.
   - Endpoints REST en Express con rutas claras y manejo de errores.
   - Uso de pruebas unitarias para las partes críticas del flujo.

4. **Transparencia en las plazas**
   - Cálculo consistente de plazas ocupadas por taller.
   - Evitar sobrecupos mediante validaciones en backend.

---

## 3. Alcance del proyecto

### Incluido en el alcance

- Frontend:
  - SPA creada con Create React App.
  - Componentes:
    - `App` (flujo principal y routing mínimo).
    - `Login` (inicio de sesión).
    - `Register` (alta de tutores).
    - `InscripcionForm` (formulario de nueva inscripción).
    - `InscripcionesTutor` (lista, pagos, cancelaciones, export).
  - Estilos básicos (Bootstrap o CSS sencillo).
  - Llamadas a API backend vía `fetch` (sin libs extra).

- Backend:
  - API REST con Node.js + Express.
  - Módulo de conexión a BD (`db.js`).
  - Endpoints principales:
    - Autenticación (`/api/auth/login`, `/api/auth/register`).
    - Talleres (`/api/talleres`).
    - Inscripciones (`/api/inscripciones`, `/api/inscripciones/:id/pagar`, `/api/inscripciones/:id/cancelar`).
    - Reportes (`/api/reportes/inscripciones/:tallerId` o similar).
  - Uso de JWT y middleware para proteger endpoints restringidos.

- Base de datos:
  - Esquema básico con tablas para:
    - `tutores`.
    - `talleres`.
    - `inscripciones`.
    - (Opcional) `pagos`.

- Pruebas:
  - Plan de pruebas funcionales documentado.
  - Tests unitarios en frontend con Jest + React Testing Library para componentes clave.

### Fuera del alcance (no obligatorio)

- Gestión avanzada de roles (admin vs tutor).
- Panel de administración de talleres (creación/edición desde UI).
- Pasarela de pago real (Stripe, PayPal…).
- i18n completo multi-idioma.
- Cobertura de tests al 100% o tests E2E con Cypress, etc.

---

## 4. Usuarios objetivo

- **Tutor/Padre/Madre**
  - Usuario principal.
  - Necesita ver y gestionar inscripciones de sus hijos/as a distintos talleres.

- **Organización (implícito)**
  - Recibe los reportes CSV.
  - Utiliza la información para gestionar ocupación y logística de talleres.

---

## 5. Entregables principales

1. **Código fuente**:
   - Carpeta `frontend/`: aplicación React.
   - Carpeta `backend/`: API Node/Express.

2. **Documentación**:
   - Plan de pruebas funcionales.
   - Descripción de endpoints de backend (mínimo listado).
   - Memory Bank (esta carpeta `memory-bank/`) como documentación viva.

3. **Pruebas unitarias**:
   - Ficheros `*.test.js` en `frontend/src/` para componentes clave.
   - Evidencia de ejecución (`npm test` en verde).

---

## 6. Criterios de éxito

El proyecto se considera exitoso si:

- Un tutor puede:
  - Registrarse, iniciar sesión y mantener la sesión mientras navega.
  - Ver sus inscripciones y su estado.
  - Crear nuevas inscripciones respetando las reglas de validación.
  - Cambiar estados a `pagado` o `cancelada` correctamente.
  - Descargar un reporte CSV funcional.

- El código:
  - Está estructurado, legible y consistente.
  - Tiene una base razonable de tests unitarios que pasan en verde.

- La documentación:
  - Describe correctamente el producto (qué hace y por qué).
  - Explica la arquitectura y las decisiones técnicas.
  - Permite retomar el proyecto tras un “reset de memoria” sin perder contexto.
