# techContext.md – Stack Tecnológico y Setup

## 1. Visión general del stack

### Frontend

- **Framework**: React
- **Bootstrapping**: Create React App (CRA)
- **Lenguaje**: JavaScript (ES6+)
- **Testing**: Jest + React Testing Library
- **Estilos**:
  - CSS propio + clases de Bootstrap (o similar) para maquetación rápida
- **Gestión de estado**:
  - `useState` / `useEffect` en componentes.
  - Estado global mínimo gestionado en `App.js` (usuario, token, tutorId).

### Backend

- **Runtime**: Node.js
- **Framework**: Express
- **Base de datos**: SQL (a través de `db.js`, usando probablemente `mysql2` o similar)
- **Autenticación**: JSON Web Tokens (JWT)
- **Config**: Variables de entorno en `.env`

### Herramientas de desarrollo

- **Gestor de paquetes**: npm
- **IDE**: VS Code
- **Control de versiones**: git (repositorio implícito por estructura, aunque no documentado aquí)
- **HTTP client**: `backend/pruebas.http` (para probar endpoints desde VS Code / REST Client)

---

## 2. Frontend – Detalles técnicos

### 2.1 Estructura principal

```text
frontend/
  package.json
  src/
    index.js
    App.js
    App.css
    components/
      Login.js
      Register.js
      InscripcionForm.js
      InscripcionesTutor.js
      *.test.js
```

### 2.2 Entrypoint

- `src/index.js`:
  - Renderiza `<App />` en el `root` del DOM.
  - Configuración estándar de CRA (reportWebVitals, etc., si no se ha eliminado).

### 2.3 App.js

Responsabilidades técnicas:

- Mantener en `useState`:
  - Tutor autenticado (objeto usuario).
  - Token JWT.
  - Algún flag o versión/contador para forzar recarga de inscripciones tras altas.
- Lógica:
  - Si no hay token/usuario → mostrar vista de Login/Registro.
  - Si hay token/usuario → mostrar vista principal de inscripciones.
- Pasa callbacks hacia abajo:
  - `onLogin(token, usuario)` → desde `Login`.
  - `onRegistered()` → desde `Register`.
  - `onInscripcionCreada()` → actualizar versión o estado para refrescar lista.

### 2.4 Comunicación con la API

- Se usan llamadas `fetch` nativas, sin Axios.
- Puntos importantes:
  - `Content-Type: application/json` en POST/PUT.
  - Inclusión del token JWT en cabeceras cuando es necesario (`Authorization: Bearer ...`).
  - Manejo de respuestas:
    - `response.ok` + `json()` → se comprueba `ok` interno y `message`.

### 2.5 Testing frontend

Config:

- CRA ya incluye Jest y React Testing Library:
  - Ficheros `*.test.js` en `src/` se ejecutan con `npm test`.

Tests implementados:

- `App.test.js`
- `components/Login.test.js`
- `components/Register.test.js`
- `components/InscripcionForm.test.js`
- `components/InscripcionesTutor.test.js`

Patrones técnicos en tests:

- Mock de `global.fetch`:

  ```js
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
  ```

- Debido a que los `<label>` HTML NO usan `htmlFor` ni inputs tienen `id`, se recurre a:

  - `screen.getByText("Texto del label")`
  - `label.parentElement.querySelector("input" | "select")`

- Uso de helpers para evitar repetir lógica:
  - `getInputs`, `getLoginInputs`, `getRegisterInputs`.
- Sin snapshots; tests centrados en:
  - Render.
  - Validaciones.
  - Llamadas a callbacks.
  - Efectos tras acciones (cambio de estado, mensajes, etc.).

Comando:

```bash
cd frontend
npm install       # una sola vez
npm test          # correr tests en watch mode
```

---

## 3. Backend – Detalles técnicos

### 3.1 server.js

Responsabilidades técnicas:

- Crear app Express.
- Usar middlewares típicos:
  - `express.json()` para parsear JSON.
  - CORS (si está configurado).
- Definir rutas REST bajo `/api`:
  - `/api/auth/...`
  - `/api/talleres`
  - `/api/inscripciones`
  - `/api/reportes/...`
- Escuchar en `process.env.PORT` o puerto por defecto.

Estructura típica:

```js
const express = require("express");
const app = express();
app.use(express.json());
// ... rutas ...
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
module.exports = app; // recomendable para tests futuros
```

### 3.2 db.js

- Encapsula la lógica de conexión a base de datos.
- Patrón usual:
  - Crear un pool de conexiones usando cliente SQL (MySQL/PostgreSQL).
  - Exportar un método `query(sql, params)` que devuelve `Promise`.

Ejemplo conceptual:

```js
const pool = createPool({ /* config desde .env */ });

module.exports = {
  query: (sql, params) => pool.execute(sql, params),
};
```

### 3.3 Variables de entorno (.env)

Campos típicos:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `PORT`

Uso:

- Mediante `process.env` en `server.js` y `db.js`.
- Se puede usar `dotenv` para cargarlas automáticamente:

```js
require("dotenv").config();
```

---

## 4. Autenticación JWT – Detalle técnico

- Librería sugerida: `jsonwebtoken`.

Flujo:

1. **Login**:
   - `POST /api/auth/login` recibe `email`, `password`.
   - Busca tutor en BD.
   - Verifica contraseña (bcrypt/criptografía).
   - Si correcto:
     - `jwt.sign({ sub: tutor.id, email: tutor.email }, process.env.JWT_SECRET, { expiresIn: 'x h' })`.
   - Devuelve: `{ ok: true, token, usuario }`.

2. **Middleware de protección**:
   - Revisa `Authorization: Bearer <token>`.
   - `jwt.verify(token, JWT_SECRET)`:
     - Si ok: `req.user = payload` y `next()`.
     - Si falla: 401.

3. **Endpoints protegidos**:
   - P.ej. `/api/inscripciones/tutor/:id`:
     - Comparar `req.params.id` con `req.user.sub` para evitar acceso cruzado.

---

## 5. Dependencias principales (package.json)

### 5.1 frontend/package.json (relevante)

- `react`, `react-dom`, `react-scripts`.
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (según CRA).
- Scripts clave:
  - `"start": "react-scripts start"`
  - `"build": "react-scripts build"`
  - `"test": "react-scripts test"`

### 5.2 backend/package.json (relevante)

Dependencias típicas:

- `express`
- Cliente BD (`mysql2`, `pg` o similar).
- `jsonwebtoken`
- `dotenv`
- **DevDependencies** (si se añaden tests backend):
  - `jest`
  - `supertest`

Scripts esperables:

- `"start": "node server.js"`
- `"dev": "nodemon server.js"` (si se configura).
- `"test": "jest"` (para futuro).

---

## 6. Setup de desarrollo

### 6.1 Puesta en marcha backend

Comandos típicos:

```bash
cd backend
npm install        # una vez
npm run dev        # si existe, con nodemon
# o
npm start          # node server.js
```

Requisitos previos:

- Base de datos creada y accesible.
- `.env` configurado correctamente.

### 6.2 Puesta en marcha frontend

```bash
cd frontend
npm install
npm start
```

- App arrancará en `http://localhost:3000`.
- El backend probablemente en `http://localhost:3001` o similar.
- Configuración de **proxy** en `frontend/package.json` (si se usa) para redirigir API:

```json
"proxy": "http://localhost:3001"
```

---

## 7. Consideraciones y constraints técnicos

- **Sin TypeScript**:
  - Todo el proyecto está en JS. Si se introduce TS en el futuro, habrá que adaptar tooling.
- **Sin Router avanzado**:
  - No se usa `react-router-dom`; navegación controlada por condicionales en `App`.
- **Accesibilidad limitada**:
  - `label` sin `htmlFor` → afecta accesibilidad y testabilidad.
  - Documentado como punto de mejora (añadir `id`/`htmlFor` y usar `getByLabelText` en tests).

---

## 8. Testing y calidad

- Foco actual:
  - Tests unitarios frontend.
- Prácticas usadas:
  - Tests centrados en comportamiento observable (texto, botones, cambios de estado).
  - Mock de `fetch` para aislar frontend.
- Futuro:
  - Añadir tests backend con Jest + Supertest.
  - Posible integración E2E con Cypress/Playwright (no obligatorio para este proyecto).

Este documento debe usarse como referencia rápida para recordar **cómo está montado el stack**, qué dependencias críticas hay y cómo arrancar el entorno tras un “reset de memoria”.
