<h1 align="center">🧒 Aplicación de Inscripciones a Talleres de Verano 🎨</h1>

<p align="center">
  <b>Gestión de inscripciones, plazas y pagos para talleres infantiles</b>
</p>

---

## 📝 Documentos base del proyecto

> Coloca tus PDFs en alguna carpeta (por ejemplo `docs/pdf/`) y ajusta las rutas de los enlaces.

- 📋 <b><a href="../Análisis funcional y de requisitos.pdf">Análisis de requisitos</a></b>
- 👤 <b><a href="../Historias de Usuario.docx">Historias de usuario</a></b>
- 🛠️ <b><a href="../Diseño y propuesta.docx">Diseño técnico y propuesta tecnológica</a></b>

---

## 🖼️ Capturas de Pantalla Principales

<p align="center">
  <b>Pantalla de Login</b><br>
  <img src="temp_image_1775041650053.png" alt="Pantalla de Login" width="800" /><br>
</p>

<p align="center">
  <b>Panel principal del tutor (inscripciones + formulario)</b><br>
  <img src="temp_image_1775041702637.png" alt="Panel principal del tutor" width="800" /><br>
</p>

<p align="center">
  <b>Selección de taller con plazas disponibles</b><br>
  <img src="temp_image_1775041717648.png" alt="Selección de taller y plazas" width="800" /><br>
</p>

<p align="center">
  <b>Confirmación de cancelación de inscripción</b><br>
  <img src="temp_image_1775041734728.png" alt="Confirmación de cancelación de inscripción" width="800" /><br>
</p>

> Guarda las imágenes que has generado (login, panel con inscripciones, selector de taller, diálogo de cancelar) en  
> `docs/screenshots/` con estos nombres:
> - `login.png`
> - `panel-tutor.png`
> - `seleccion-taller.png`
> - `cancelacion-inscripcion.png`

---

## 🌍 Estructura del Proyecto

Desde la raíz del repositorio:

```text
repo-root/
├── backend/             # API REST, lógica de negocio y seguridad (Node + Express)
├── frontend/            # SPA React: login, registro, inscripciones, listados
├── memory-bank/         # Contexto vivo: arquitecturas, decisiones, progreso
├── docs/
│   └── screenshots/     # ⇦ Coloca aquí las capturas usadas en el README
├── Análisis funcional y de requisitos.docx
├── Historias de Usuario.docx
├── Diseño y propuesta.docx
```

---

## 🚦 Quickstart

|                         | 🔙 Backend                          | 🔜 Frontend                      |
|-------------------------|-------------------------------------|----------------------------------|
| **Instalación**         | `cd backend`<br>`npm install`       | `cd frontend`<br>`npm install`   |
| **Ejecutar**            | `npm start`                         | `npm start`                      |
| **Tests Unitarios**     | _(pendiente de configurar)_         | `npm test`                       |

- El frontend se sirve típicamente en `http://localhost:3000`.
- El backend en `http://localhost:3001` (o el puerto configurado en `.env`).
- Si se usa proxy en CRA, se define en `frontend/package.json`:

```json
"proxy": "http://localhost:3001"
```

---

## ✨ Tecnologías Principales

- <b>Frontend:</b> React (Create React App), JavaScript ES6+, Bootstrap/CSS, SPA centrada en el tutor.
- <b>Backend:</b> Node.js, Express, base de datos SQL vía `db.js`, autenticación JWT, API REST.
- <b>Testing:</b>
  - Frontend: Jest + React Testing Library.
  - Tests implementados para: `App`, `Login`, `Register`, `InscripcionForm`, `InscripcionesTutor`.

---

## 🧠 Memory Bank (documentación viva)

La carpeta `memory-bank/` contiene toda la información necesaria para retomar el proyecto tras un “reset de memoria”:

- `projectbrief.md` – Objetivos, alcance y criterios de éxito del proyecto.
- `productContext.md` – Problema que resuelve, escenarios de uso, UX deseada.
- `systemPatterns.md` – Arquitectura frontend/backend, flujos y patrones de diseño.
- `techContext.md` – Stack tecnológico, setup de desarrollo y dependencias.
- `activeContext.md` – Foco actual del trabajo, decisiones recientes.
- `progress.md` – Qué está hecho, qué falta, siguientes pasos.

> Antes de seguir evolucionando el proyecto, **leer siempre** los ficheros de `memory-bank/` para recuperar el contexto.

---

## 👩‍💻 Cómo entender/elaborar el proyecto

1. Revisa primero los documentos funcionales:
   - “Análisis de requisitos”
   - “Historias de usuario”
   - “Diseño y propuesta”

2. Consulta la Memory Bank:
   - Entiende la arquitectura, el stack y las decisiones clave.
   - Mira `progress.md` para ver el estado actual y qué queda por hacer.

3. Explora el código:
   - `frontend/src/components/` para login, registro e inscripciones.
   - `backend/` para rutas, lógica de negocio y acceso a base de datos.

4. Verifica las pruebas:
   - Ejecuta `npm test` en `frontend` y revisa los tests unitarios que acompañan a cada funcionalidad crítica.

<hr />
