# systemPatterns.md – Arquitectura y Patrones

## 1. Visión de alto nivel

Arquitectura **cliente-servidor** clásica:

- **Frontend**: SPA en React (Create React App).
- **Backend**: API REST en Node.js + Express.
- **Base de datos**: gestionada vía módulo `db.js` (driver SQL, pool de conexiones).
- **Autenticación**: JWT.
- **Comunicación**: llamadas HTTP desde el frontend a `/api/...` en el backend.

Diagrama simplificado:

```text
[React SPA] --fetch--> [Express API] --query--> [Base de Datos]
                         ^
                         |
                       JWT
```

---

## 2. Frontend – Patrones y estructura

### 2.1 Estructura de carpetas relevante

```text
frontend/
  src/
    App.js
    index.js
    components/
      Login.js
      Register.js
      InscripcionForm.js
      InscripcionesTutor.js
    App.test.js
    components/
      *.test.js
```

### 2.2 Patrones de componentes

- **App.js**
  - Componente raíz.
  - Gestiona:
    - Estado global mínimo: usuario autenticado, token, tutorId.
    - Renderiza:
      - Pantalla de `Login` / `Register` cuando no hay sesión.
      - Pantalla de inscripciones (`InscripcionForm` + `InscripcionesTutor`) cuando el tutor está logado.
  - Patrón: **Container component** ligero que orquesta otros componentes.

- **Login.js**
  - Formulario controlado:
    - Campos: `email`, `password`.
    - Estado local con `useState`.
  - Encapsula la lógica de autenticación:
    - Llama a `/api/auth/login`.
    - Si éxito: llama a `onLogin(token, usuario)` proporcionado por `App`.
    - Si error: muestra mensaje legible.
  - Patrón: **Smart form component** con responsabilidad de orquestar la llamada y manejar errores UI.

- **Register.js**
  - Formulario controlado:
    - Campos: nombre, apellido, email, teléfono, password, repeatPassword.
  - Validaciones en cliente:
    - Contraseñas coinciden.
    - Campos mínimos requeridos.
  - Llama al endpoint de registro:
    - Si ok: muestra mensaje y llama `onRegistered()` para que `App` pueda cambiar a login o actualizar estado.
  - Patrón: **Form con validaciones en cliente + llamada simple a API**.

- **InscripcionForm.js**
  - Formulario controlado para alta de inscripciones.
  - `useEffect` para cargar talleres al montar:
    - `GET /api/talleres`.
    - Almacena lista de talleres en estado local.
  - Validación cliente:
    - Fecha de nacimiento no puede ser futura.
  - Flujo:
    - Al enviar:
      - Valida en cliente.
      - Envía `POST /api/inscripciones` con `tutor_id` y `taller_id`.
      - Si ok:
        - Limpia formulario.
        - Llama a `onInscripcionCreada(datos)` hacia `App` o `InscripcionesTutor`.
        - Vuelve a cargar talleres para actualizar plazas ocupadas.
  - Patrón: **Form con side effects** (carga inicial + recarga tras alta) y comunicación ascendente por callback.

- **InscripcionesTutor.js**
  - Tabla de inscripciones del tutor.
  - Recibe:
    - `tutorId`, `token`, `version` (o similar) como props.
  - `useEffect`:
    - Carga inicial de inscripciones del tutor: `GET /api/inscripciones/tutor/:id`.
    - Se vuelve a disparar cuando `version` cambia, permitiendo que `App` fuerce recarga tras nuevas inscripciones.
  - Acciones de fila:
    - `Pagar`:
      - `PUT /api/inscripciones/:id/pagar`.
      - Actualiza estado local a `pagado` si la llamada tiene éxito.
    - `Cancelar`:
      - Pide confirmación con `window.confirm`.
      - `PUT /api/inscripciones/:id/cancelar`.
      - Actualiza estado local a `cancelada`.
  - Patrón: **List component** que encapsula operaciones CRUD sobre cada item mediante botones.

### 2.3 Patrones de pruebas frontend

- Uso de **Jest + React Testing Library**.
- Tests colocados junto a componentes en `src/components/*.test.js`.
- Patrones usados:
  - `screen.getByText`, `screen.findByText`, `screen.getByRole`.
  - Debido a que los `label` no usan `htmlFor`, los tests:
    - Localizan el `<label>` por su texto visible.
    - Luego usan `label.parentElement.querySelector("input" | "select")` para obtener el control asociado.
  - Mock de `global.fetch` para desacoplar tests de la API real.
  - En algunos casos, helper functions (`getInputs`, `getLoginInputs`, `getRegisterInputs`) para centralizar selección de nodos y evitar duplicación.

---

## 3. Backend – Arquitectura y patrones

### 3.1 Estructura de archivos relevante

```text
backend/
  server.js
  db.js
  .env
  package.json
  pruebas.http
```

- `server.js`:
  - Inicializa Express.
  - Configura middlewares (CORS, JSON).
  - Define rutas `/api/...`.
  - Arranca el servidor.

- `db.js`:
  - Gestiona conexión a BD.
  - Expone funciones para ejecutar consultas (`query`, etc.).

- `.env`:
  - Variables secretas:
    - Credenciales de BD.
    - `JWT_SECRET`.
    - Puerto, etc.

### 3.2 Patrones de enrutado y controladores (implícitos)

Aunque no hay separación estrita `routes/` vs `controllers/` en ficheros distintos, el patrón lógico es:

- Rutas Express en `server.js` agrupadas por recurso:
  - `/api/auth/...`
  - `/api/talleres`
  - `/api/inscripciones`
  - `/api/reportes/...`

Cada ruta:

1. Valida entrada (body, params).
2. Llama a la BD a través de `db.js`.
3. Aplica reglas de negocio.
4. Devuelve JSON (o CSV en caso de reporte) con estructura consistente:
   - `{ ok: true, data... }` en éxito.
   - `{ ok: false, message: "..." }` en error.

### 3.3 Patrones de negocio clave

- **Validación de fecha de nacimiento**:
  - Backend valida que la fecha no sea mayor que `hoy`.
  - Protege incluso si el frontend no valida o se manipulan peticiones.

- **Control de cupo en talleres**:
  - Antes de crear una inscripción:
    - Se consulta #inscripciones activas para ese taller.
    - Se compara con `cupo_maximo` del taller.
  - Si supera cupo → error y no se crea inscripción.

- **Evitar duplicados**:
  - Antes de insertar:
    - Se comprueba si ya existe inscripción para el mismo participante y taller.
  - Si existe → error y no se inserta.

- **Gestión de estados**:
  - Los endpoints de `pagar` y `cancelar` actualizan solo el campo `estado`.
  - La lógica de negocio se concentra en backend:
    - No confiar en que el frontend envíe estados arbitrarios.

- **Reportes CSV**:
  - Endpoint específico genera un string CSV.
  - Cabeceras HTTP ajustadas (`Content-Type: text/csv`, etc.).
  - El frontend descarga el archivo directamente.

---

## 4. Autenticación y autorización

Patrón: **JWT stateless**.

- Al hacer login:
  - Verifica credenciales.
  - Genera un JWT con:
    - `sub` = id tutor.
    - Otros datos relevantes (nombre, email).
  - Devuelve token y datos de usuario.

- En endpoints protegidos:
  - Middleware de autenticación:
    - Extrae token de `Authorization: Bearer ...`.
    - Verifica firma con `JWT_SECRET`.
    - Adjunta info del usuario al `req` (`req.user`).
  - Lógica posterior confía en `req.user` para:
    - Saber `tutor_id`.
    - Garantizar que solo ve/modifica sus datos.

---

## 5. Flujo de datos y dependencias

### 5.1 Frontend → Backend

- `Login`:
  - `POST /api/auth/login` → { ok, token, usuario }.
  - Guarda token en estado (no en localStorage, salvo que se decida).

- `Register`:
  - `POST /api/auth/register` → { ok, message }.

- `InscripcionForm`:
  - `GET /api/talleres` → lista de talleres con `ocupadas`/`cupo_maximo`.
  - `POST /api/inscripciones` → { ok, message } y luego recarga de talleres.

- `InscripcionesTutor`:
  - `GET /api/inscripciones/tutor/:id` (con token).
  - `PUT /api/inscripciones/:id/pagar`.
  - `PUT /api/inscripciones/:id/cancelar`.
  - `GET /api/reportes/inscripciones/:tallerId` (CSV).

### 5.2 Dependencias entre componentes de frontend

- `App`:
  - Pasa `onLogin` a `Login`.
  - Pasa `onRegistered` a `Register`.
  - Una vez logado:
    - Pasa `tutorId`, `token`, y funciones de refresco a `InscripcionForm` y `InscripcionesTutor`.
  - Controla un `version` o similar para provocar recarga de listado tras crear inscripciones.

---

## 6. Patrones de pruebas (detalle)

### 6.1 Frontend

- **Tests unitarios de UI + comportamiento**:
  - `App.test.js`:
    - Verifica render de título principal.
  - `Login.test.js`:
    - Render UI.
    - Error credenciales.
    - Llamada a `onLogin` en éxito.
  - `Register.test.js`:
    - Render UI.
    - Validación de contraseñas.
    - Llamada a `onRegistered`.
  - `InscripcionForm.test.js`:
    - Render campos + carga de talleres.
    - Validación de fecha futura.
    - Flujo de creación y limpieza de formulario.
  - `InscripcionesTutor.test.js`:
    - Lista vacía.
    - Render de estados.
    - Flujos de pagar y cancelar.

- Patrones importantes:
  - `beforeEach/afterEach` para mockear/restaurar `global.fetch`.
  - Helpers para encontrar inputs usando los textos exactos de los labels, debido a ausencia de `htmlFor`.
  - Uso de `waitFor` y `findBy*` para esperar a efectos asíncronos.

### 6.2 (Futuro) Backend

- Usar Jest + Supertest.
- Patrones propuestos:
  - Exportar `app` desde `server.js` para poder testear sin levantar servidor real.
  - Mock de `db.js` (`jest.mock("../db")`) para controlar las respuestas de la base de datos.
  - Tests para:
    - `/api/auth/login`.
    - `/api/inscripciones` (validaciones, cupo, duplicados).
    - `/api/talleres` (cálculo de `ocupadas`).
    - `/api/reportes/...` (cabeceras y estructura CSV).

---

## 7. Decisiones clave y trade-offs

1. **Sin router completo en frontend**:
   - Se mantiene un flujo sencillo controlado en `App` (estado de login y vistas condicionales).
   - Evita complejidad de `react-router` para esta práctica.

2. **Validaciones duplicadas (cliente + servidor)**:
   - Cliente: mejora UX inmediata (mensajes rápidos).
   - Servidor: seguridad real, evita manipulación.

3. **Tests unitarios solo frontend (de momento)**:
   - Prioriza mostrar competencia en React + Testing Library.
   - Backend tests se dejan como mejora futura documentada.

4. **HTML sin `htmlFor` en labels**:
   - Obliga a usar patrones de selección alternativos en tests (`getByText` + `parentElement`).
   - Documentado en Memory Bank como consideración para futuras refactorizaciones (añadir `id` y `htmlFor` mejoraría accesibilidad y testabilidad).

---

## 8. Rutas críticas

- `POST /api/inscripciones`:
  - Punto central donde se cruzan:
    - Validación de datos.
    - Reglas de negocio (fecha, duplicados, cupo).
    - Integridad de datos (no romper ocupación de talleres).
- `GET /api/talleres`:
  - Base de la UX para inscripción (mostrar plazas).
- `PUT /api/inscripciones/:id/pagar` y `:id/cancelar`:
  - Clave para coherencia de estados.
- `GET /api/reportes/...`:
  - Conecta lógica interna con necesidades de la organización.

Estas rutas deben considerarse siempre de alto impacto en cualquier cambio futuro.
