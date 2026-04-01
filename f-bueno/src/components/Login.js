import React, { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    try {
      const resp = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (data.ok) {
        onLogin(data.token, data.usuario);
      } else {
        setMensaje(data.message || "Error de autenticación");
      }
    } catch (err) {
      setMensaje("Error al conectar con el servidor");
    }
  };

  return (
    <form className="p-3" onSubmit={handleSubmit}>
      <h2>Iniciar Sesión</h2>
      <div className="mb-3">
        <label>Email</label>
        <input type="email" className="form-control"
          value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label>Contraseña</label>
        <input type="password" className="form-control"
          value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary">Entrar</button>
      {mensaje && <div className="mt-2 alert alert-warning">{mensaje}</div>}
    </form>
  );
}

export default Login;