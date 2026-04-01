import React, { useEffect, useState } from "react";

function InscripcionForm({ tutorId, onInscripcionCreada }) {
  const [talleres, setTalleres] = useState([]);
  const [form, setForm] = useState({
    participante_nombre: "",
    participante_apellido: "",
    fecha_nacimiento: "",
    taller_id: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [ok, setOk] = useState(false);

  // Cargar talleres disponibles al iniciar
  useEffect(() => {
    recargarTalleres();
  }, []);

  function recargarTalleres() {
    fetch("http://localhost:3000/api/talleres")
      .then((res) => res.json())
      .then((data) => setTalleres(data.talleres || []))
      .catch(() => {
        // Si falla, dejamos la lista como esté
      });
  }

  // Fecha máxima permitida (hoy) en formato YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // Actualizar form
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Enviar inscripción
  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");
    setOk(false);

    // Validación adicional en cliente: fecha de nacimiento no puede ser futura
    if (form.fecha_nacimiento && form.fecha_nacimiento > today) {
      setMensaje("La fecha de nacimiento no puede ser posterior a hoy.");
      return;
    }

    try {
      const resp = await fetch("http://localhost:3000/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tutor_id: tutorId }),
      });
      const data = await resp.json();
      if (data.ok) {
        setOk(true);
        setMensaje("¡Inscripción realizada correctamente!");

        // Volver a cargar talleres para refrescar ocupadas/cupo
        recargarTalleres();

        // Notificar al padre (App) que se ha creado una nueva inscripción
        if (onInscripcionCreada) {
          onInscripcionCreada({
            participante_nombre: form.participante_nombre,
            participante_apellido: form.participante_apellido,
            fecha_nacimiento: form.fecha_nacimiento,
            taller_id: form.taller_id,
          });
        }

        // Limpiar formulario
        setForm({
          participante_nombre: "",
          participante_apellido: "",
          fecha_nacimiento: "",
          taller_id: "",
        });
      } else {
        setMensaje(data.message);
      }
    } catch {
      setMensaje("Error al conectar con el servidor");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <h2>Nueva inscripción</h2>
      <div className="mb-3">
        <label>Nombre del participante</label>
        <input
          type="text"
          name="participante_nombre"
          value={form.participante_nombre}
          required
          className="form-control"
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label>Apellido del participante</label>
        <input
          type="text"
          name="participante_apellido"
          value={form.participante_apellido}
          required
          className="form-control"
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label>Fecha de nacimiento</label>
        <input
          type="date"
          name="fecha_nacimiento"
          value={form.fecha_nacimiento}
          required
          className="form-control"
          onChange={handleChange}
          max={today}
        />
      </div>
      <div className="mb-3">
        <label>Taller</label>
        <select
          name="taller_id"
          value={form.taller_id}
          required
          className="form-select"
          onChange={handleChange}
        >
          <option value="">Seleccione un taller</option>
          {talleres.map((t) => (
            <option value={t.id} key={t.id}>
              {t.nombre} ({t.ocupadas || 0}/{t.cupo_maximo} plazas)
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-success" type="submit">
        Inscribir
      </button>
      {mensaje && (
        <div className={`alert mt-2 ${ok ? "alert-success" : "alert-danger"}`}>
          {mensaje}
        </div>
      )}
    </form>
  );
}

export default InscripcionForm;
