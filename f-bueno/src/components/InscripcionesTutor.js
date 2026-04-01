import React, { useEffect, useState } from "react";

// Componente para listar y cancelar inscripciones del tutor autenticado
function InscripcionesTutor({ tutorId, token, version }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar inscripciones del tutor al montar el componente
  // y cada vez que cambie "version" (nueva inscripción creada)
  useEffect(() => {
    if (!token || !tutorId) return;
    setCargando(true);
    setError(null);
    fetch(`http://localhost:3000/api/inscripciones/tutor/${tutorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.message || "Error al obtener inscripciones");
          setInscripciones([]);
        } else {
          setInscripciones(data.inscripciones || []);
          setError(null);
        }
        setCargando(false);
      })
      .catch(() => {
        setError("No se pudo conectar con el servidor backend.");
        setCargando(false);
      });
  }, [tutorId, token, version]);

  // Cancelar inscripción
  function handleCancelar(id) {
    if (window.confirm("¿Quieres cancelar esta inscripción?")) {
      fetch(`http://localhost:3000/api/inscripciones/${id}/cancelar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setInscripciones((prev) =>
              prev.map((insc) =>
                insc.id === id ? { ...insc, estado: "cancelada" } : insc
              )
            );
          } else {
            alert(data.message || "No se pudo cancelar la inscripción.");
          }
        })
        .catch(() => {
          alert("Error de conexión al cancelar la inscripción.");
        });
    }
  }

  // Marcar inscripción como pagada
  function handleMarcarPagada(id, tutorId, monto) {
    fetch(`http://localhost:3000/api/inscripciones/${id}/pagar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tutorId, monto }), // Enviar siempre tutorId y monto
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setInscripciones((prev) =>
            prev.map((insc) =>
              insc.id === id ? { ...insc, estado: "pagado" } : insc
            )
          );
        } else {
          alert(data.message || "No se pudo cambiar el estado.");
        }
      })
      .catch(() => {
        alert("Error de conexión al marcar como pagada.");
      });
  }

  if (cargando)
    return <div className="alert alert-info">Cargando inscripciones...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h3>Mis inscripciones</h3>
      {inscripciones.length === 0 ? (
        <div className="alert alert-secondary">
          No hay inscripciones registradas.
        </div>
      ) : (
        <table className="table table-striped table-bordered align-middle">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Nacimiento</th>
              <th>Taller</th>
              <th>Del</th>
              <th>Al</th>
              <th>Fecha inscripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((insc) => (
              <tr key={insc.id}>
                <td>
                  {insc.participante_nombre} {insc.participante_apellido}
                </td>
                <td>{insc.fecha_nacimiento?.slice(0, 10) || ""}</td>
                <td>{insc.taller}</td>
                <td>{insc.fecha_inicio?.slice(0, 10) || ""}</td>
                <td>{insc.fecha_fin?.slice(0, 10) || ""}</td>
                <td>{insc.fecha_inscripcion?.slice(0, 10) || ""}</td>
                <td>
                  {insc.estado === "cancelada" ? (
                    <span className="badge bg-secondary">Cancelada</span>
                  ) : insc.estado === "pagado" ? (
                    <span className="badge bg-success">Pagado</span>
                  ) : (
                    <span className="badge bg-primary">{insc.estado}</span>
                  )}
                </td>
                <td>
                  {insc.estado !== "cancelada" && (
                    <button
                      className="btn btn-sm btn-danger me-2"
                      onClick={() => handleCancelar(insc.id)}
                    >
                      Cancelar
                    </button>
                  )}
                  {insc.estado !== "pagado" &&
                    insc.estado !== "cancelada" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          handleMarcarPagada(
                            insc.id,
                            tutorId,
                            insc.monto || 50
                          )
                        }
                      >
                        Pagar
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InscripcionesTutor;
