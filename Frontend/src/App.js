import "./App.css";

import React, { useState } from "react";
import Login from "./components/Login";
import InscripcionForm from "./components/InscripcionForm";
import InscripcionesTutor from "./components/InscripcionesTutor";
import Register from "./components/Register";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [inscripcionesVersion, setInscripcionesVersion] = useState(0);

  function handleLogin(token, usuario) {
    localStorage.setItem("token", token);
    setToken(token);
    setUsuario(usuario);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUsuario(null);
    setToken(null);
    setInscripcionesVersion(0);
  }

  function handleRegistered() {
    // Al registrarse correctamente, volvemos a la pantalla de login
    setShowRegister(false);
  }

  function handleInscripcionCreada() {
    // Incrementar versión para forzar recarga de inscripciones del tutor
    setInscripcionesVersion((v) => v + 1);
  }

  if (!usuario) {
    return (
      <div className="container mt-4">
        {!showRegister ? (
          <div>
            <h1>Aplicación de Inscripciones</h1>
            <Login onLogin={handleLogin} />
            <p className="mt-3">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                onClick={() => setShowRegister(true)}
              >
                Registrarme
              </button>
            </p>
          </div>
        ) : (
          <div>
            <h1>Alta de nuevo usuario</h1>
            <Register onRegistered={handleRegistered} />
            <p className="mt-3">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                onClick={() => setShowRegister(false)}
              >
                Ir al login
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <button className="btn btn-link float-end" onClick={handleLogout}>
        Cerrar sesión
      </button>
      <h1>Bienvenido, {usuario.nombre}</h1>
      {usuario && (
        <InscripcionForm
          tutorId={usuario.id}
          onInscripcionCreada={handleInscripcionCreada}
        />
      )}
      {usuario && (
        <InscripcionesTutor
          tutorId={usuario.id}
          token={token}
          version={inscripcionesVersion}
        />
      )}
    </div>
  );
}

export default App;
