# productContext.md – Aplicación de Inscripción a Talleres

## 1. Problema que resuelve

Organizar talleres de verano infantiles implica coordinar:

- Múltiples actividades (talleres) con fechas y cupos limitados.
- Varios tutores (padres/madres) inscribiendo a varios niños.
- Control de plazas, pagos y posibles cancelaciones.
- Necesidad de informes para organización (listados, ocupación, etc.).

En muchos casos esto se hace con:

- Hojas de cálculo manuales.
- Formularios en papel o correos electrónicos.
- Procesos poco claros para cambios y cancelaciones.

Esto genera:

- Riesgo de **sobrecupo** (más inscritos que plazas).
- Dificultad para saber el **estado** de cada inscripción (pagado/pendiente/cancelado).
- Poca trazabilidad para la organización (quién está en qué taller).
- Mala experiencia para el tutor, que no tiene una visión clara ni control de sus inscripciones.

La aplicación aborda ese problema con un sistema simple pero completo, centrado en el tutor y en la organización.

---

## 2. Qué hace el producto

### 2.1 Desde el punto de vista del tutor

El tutor puede:

1. **Crear cuenta (Registro)**
   - Introduce sus datos básicos (nombre, apellido, email, teléfono, contraseña).
   - El sistema valida las contraseñas y crea un registro en la base de datos.
   - Recibe un mensaje de confirmación.

2. **Iniciar sesión (Login)**
   - Introduce email + contraseña.
   - El backend valida las credenciales.
   - Si son correctas:
     - Devuelve un token JWT y los datos del tutor.
   - Si son incorrectas:
     - Devuelve un mensaje de error que el frontend muestra claramente.

3. **Ver sus inscripciones**
   - Tras iniciar sesión, accede a una pantalla donde ve:
     - Lista de inscripciones (una por cada niño y taller).
     - Nombre y apellidos del participante.
     - Taller al que está inscrito.
     - Fechas del taller.
     - Estado de la inscripción (pendiente, pagado, cancelada).
   - Si no hay inscripciones, se muestra un mensaje claro.

4. **Crear nuevas inscripciones**
   - Usa un formulario para dar de alta a un participante:
     - Nombre del participante.
     - Apellido.
     - Fecha de nacimiento.
     - Selección de taller.
   - El sistema:
     - Carga la lista de talleres disponibles (con plazas y fechas).
     - Valida que la fecha de nacimiento **no es futura**.
     - Envía la solicitud al backend, que:
       - Verifica cupos.
       - Evita duplicados (mismo participante en el mismo taller).
       - Crea la inscripción si todo es correcto.
   - El tutor ve la nueva inscripción en la tabla, con estado `pendiente`.

5. **Gestionar estado de inscripciones**
   - `Pagar`:
     - Desde la tabla de inscripciones, puede marcar una inscripción como pagada.
     - El backend actualiza el estado a `pagado` y, si aplica, registra el pago.
   - `Cancelar`:
     - Puede cancelar una inscripción (previa confirmación).
     - El estado pasa a `cancelada`.
     - Se liberan plazas en el taller (según lógica de negocio implementada).

6. **Descargar reportes**
   - Puede descargar un **CSV de inscripciones** por taller (o general, según endpoint):
     - El backend genera un archivo CSV.
     - El frontend dispara la descarga.
   - Esto le sirve también a la organización para:
     - Ver listas de alumnos.
     - Ver ocupación y estados.

---

### 2.2 Desde el punto de vista de la organización

Aunque la interfaz principal está pensada para tutores, la aplicación:

- Permite obtener datos consolidados via CSV:
  - Por taller.
  - Con campos clave (participante, tutor, fechas, estado, etc.).
- Garantiza que:
  - No se sobrepasa el cupo de plazas.
  - Los estados de inscripción reflejan la realidad (pagado/cancelado).
- Sirve como punto único de verdad para inscripciones en lugar de hojas dispersas.

---

## 3. Flujo principal de usuario

1. Tutor entra en la web.
2. Si no tiene cuenta:
   - Va a **Registro**:
     - Rellena formulario.
     - En caso de error (contraseñas no coinciden, etc.), se le muestra mensaje.
     - Si todo es correcto, se le notifica y puede ir a **Login**.
3. Si tiene cuenta:
   - Va a **Login**:
     - Rellena email + contraseña.
     - Si falla, ve un error de credenciales.
     - Si acierta, entra en la zona de inscripciones.
4. En la zona de inscripciones:
   - Ve una **tabla** con inscripciones actuales.
   - Debajo o en el lateral, ve el **formulario de nueva inscripción**:
     - Selecciona taller (con información de plazas).
     - Introduce datos del participante.
5. Tras crear inscripción:
   - Aparece en la lista.
   - Puede:
     - Marcarla como **Pagado**.
     - **Cancelar** (con confirmación).
6. Opcional:
   - Descargar el **reporte CSV** de inscripciones.

---

## 4. Experiencia de usuario deseada

- **Clara y directa:**
  - Pocas pantallas.
  - Formularios sencillos.
  - Textos en idioma del usuario (español).
  - Mensajes de error específicos (no genéricos).

- **Estado siempre visible:**
  - En la tabla de inscripciones, el estado se ve claramente con badges o etiquetas:
    - `Pendiente`: estilo neutro o llamativo.
    - `Pagado`: estilo verde.
    - `Cancelada`: gris o tachado.

- **Validaciones amigables:**
  - Fecha de nacimiento futura: mensaje explicativo.
  - Campos obligatorios marcados con `*`.
  - Contraseñas no coinciden: mensaje en el formulario de registro.

- **Feedback inmediato:**
  - Tras acciones (crear, pagar, cancelar), actualización inmediata de la UI.
  - Posibles alertas/toasts informando del resultado.

- **Simplicidad sobre complejidad:**
  - No se pide más información de la necesaria.
  - No se obliga a navegar por muchas pantallas ni menús profundos.

---

## 5. Escenarios de uso clave

1. **Tutor que llega por primera vez**
   - Registra su cuenta.
   - Inicia sesión.
   - Da de alta a un hijo en uno o varios talleres.
   - Sale de la aplicación.

2. **Tutor que vuelve más tarde**
   - Inicia sesión.
   - Consulta si su inscripción está pagada.
   - Marca un pago (por ejemplo, tras haber pagado presencialmente).
   - Descarga un resumen (si se lo ofrecen).

3. **Cancelación de un taller por saturación o cambio de planes**
   - Tutor decide cancelar una inscripción:
     - Entra, localiza la inscripción, pulsa “Cancelar” y confirma.
     - La plaza vuelve a estar disponible para otros tutores.

4. **Organización antes del inicio del taller**
   - Utiliza el CSV de inscripciones para:
     - Generar listas de asistencia.
     - Comprobar que no hay sobrecupos.
     - Contactar con tutores si es necesario.

---

## 6. Limitaciones aceptadas a nivel de producto

- No existe un panel avanzado para administradores dentro del propio frontend (gestión manual de talleres probablemente vía base de datos).
- No hay proceso de recuperación de contraseña (password reset).
- No hay internacionalización; la interfaz está orientada a un solo idioma (español).
- Pagos simulados:
  - Se marca el estado como pagado, pero no se integra una pasarela real (Stripe/PayPal).

Estas limitaciones son aceptables para el objetivo educativo/demostrativo del proyecto.

---

## 7. Cómo debe evolucionar idealmente (futuro)

Aunque no es obligatorio implementarlo ahora, la documentación debe tener presente que el producto podría crecer hacia:

- Panel de administración (gestión de talleres, capacidad, horarios).
- Notificaciones por email al inscribir/cancelar.
- Autogestión de cuenta (cambio de contraseña, actualización de datos).
- Integración con pasarela de pagos real.
- Sistema de roles (admin, tutor, monitor).

La Memory Bank debe registrar estas ideas como posibles evoluciones, pero manteniendo el foco actual en el uso básico por parte del tutor y la generación de reportes para la organización.
