// server.js
require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json()); // para aceptar JSON

const cors = require('cors');
app.use(cors());



// Aquí pondremos el endpoint /api/tutores/register
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const schema = Joi.object({
  nombre: Joi.string().max(100).required(),
  apellido: Joi.string().max(100).required(),
  email: Joi.string().email().max(150).required(),
  telefono: Joi.string().max(20).allow('', null),
  password: Joi.string().min(6).max(100).required()
});

app.post('/api/tutores/register', async (req, res) => {
  // Validar el body del request
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, message: error.details[0].message });
  }

  const { nombre, apellido, email, telefono, password } = value;

  try {
    // Comprobar si el correo ya existe
    const [rows] = await db.query('SELECT id FROM tutores WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ ok: false, message: 'El email ya está registrado.' });
    }

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar en la base de datos
    await db.query(
      'INSERT INTO tutores (nombre, apellido, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, telefono, password_hash]
    );

    return res.json({ ok: true, message: 'Tutor registrado correctamente.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al registrar al tutor.' });
  }
});

// Esquema para validar talleres
const tallerSchema = Joi.object({
  nombre: Joi.string().max(100).required(),
  descripcion: Joi.string().allow('', null),
  cupo_maximo: Joi.number().min(1).required(),
  fecha_inicio: Joi.date().iso(),
  fecha_fin: Joi.date().iso()
});

app.post('/api/talleres', async (req, res) => {
  const { error, value } = tallerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, message: error.details[0].message });
  }
  const { nombre, descripcion, cupo_maximo, fecha_inicio, fecha_fin } = value;
  try {
    await db.query(
      'INSERT INTO talleres (nombre, descripcion, cupo_maximo, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, cupo_maximo, fecha_inicio, fecha_fin]
    );
    res.status(201).json({ ok: true, message: 'Taller creado correctamente.' });
  } catch (err) {
    console.error('Error al crear taller:', err);
    res.status(500).json({ ok: false, message: 'Error al crear el taller.' });
  }
});

// DEVOLVER TALLERES CON OCUPACIÓN (Nº DE PLAZAS OCUPADAS)
app.get('/api/talleres', async (req, res) => {
  try {
    const [talleres] = await db.query(
      'SELECT id, nombre, descripcion, cupo_maximo, fecha_inicio, fecha_fin FROM talleres ORDER BY fecha_inicio'
    );

    const resultados = [];
    for (const t of talleres) {
      // Contar inscripciones activas (estado NULL o != 'cancelada')
      const [[row]] = await db.query(
        'SELECT COUNT(*) AS ocupadas FROM inscripciones WHERE taller_id = ? AND (estado IS NULL OR estado != "cancelada")',
        [t.id]
      );

      const ocupadas = Number(row?.ocupadas || 0);

      resultados.push({
        ...t,
        ocupadas
      });
    }

    res.json({ ok: true, talleres: resultados });
  } catch (err) {
    console.error('Error al obtener talleres:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener talleres.' });
  }
});

//POST INSCRIPCIONES 
const inscripcionSchema = Joi.object({
  participante_nombre: Joi.string().max(100).required(),
  participante_apellido: Joi.string().max(100).required(),
  fecha_nacimiento: Joi.date().iso().required(),
  tutor_id: Joi.number().integer().required(),
  taller_id: Joi.number().integer().required()
});

app.post('/api/inscripciones', async (req, res) => {
  const { error, value } = inscripcionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, message: error.details[0].message });
  }
  const { participante_nombre, participante_apellido, fecha_nacimiento, tutor_id, taller_id } = value;

  try {
    // Validación adicional: la fecha de nacimiento no puede ser futura
    const hoy = new Date().toISOString().slice(0, 10);
    const nacimiento = new Date(fecha_nacimiento).toISOString().slice(0, 10);
    if (nacimiento > hoy) {
      return res.status(400).json({ ok: false, message: 'La fecha de nacimiento no puede ser posterior a hoy.' });
    }

    // 1. Verificar que hay cupo disponible en el taller
    const [[{ cupo_maximo }]] = await db.query(
      'SELECT cupo_maximo FROM talleres WHERE id = ?', [taller_id]
    );
    const [[{ ocupadas }]] = await db.query(
      'SELECT COUNT(*) as ocupadas FROM inscripciones WHERE taller_id = ? AND estado != "cancelada"', [taller_id]
    );
    if (ocupadas >= cupo_maximo) {
      return res.status(400).json({ ok: false, message: 'No quedan plazas disponibles en este taller.' });
    }

    // 2. Comprobar que el participante no está ya inscrito en el mismo taller
    const [dupes] = await db.query(
      `SELECT id FROM inscripciones
       WHERE tutor_id = ? AND taller_id = ? AND participante_nombre = ? AND participante_apellido = ?`,
      [tutor_id, taller_id, participante_nombre, participante_apellido]
    );
    if (dupes.length > 0) {
      return res.status(400).json({ ok: false, message: 'Participante ya inscrito en este taller.' });
    }

    // 3. Crear inscripción (por defecto en estado "pendiente")
    await db.query(
      `INSERT INTO inscripciones
        (participante_nombre, participante_apellido, fecha_nacimiento, tutor_id, taller_id)
       VALUES (?, ?, ?, ?, ?)`,
      [participante_nombre, participante_apellido, fecha_nacimiento, tutor_id, taller_id]
    );

    res.status(201).json({ ok: true, message: 'Inscripción realizada correctamente.' });
  } catch (err) {
    console.error('Error en inscripción:', err);
    res.status(500).json({ ok: false, message: 'Error al inscribir participante.' });
  }
});

//GET INSCRIPCIONES
app.get('/api/inscripciones/:tallerId', async (req, res) => {
  const tallerId = req.params.tallerId;
  try {
    const [inscripciones] = await db.query(
      `SELECT i.id, i.participante_nombre, i.participante_apellido, i.fecha_nacimiento, i.estado, t.nombre as taller
       FROM inscripciones i
       JOIN talleres t ON i.taller_id = t.id
       WHERE i.taller_id = ?`, [tallerId]);
    res.json({ ok: true, inscripciones });
  } catch (err) {
    console.error('Error al consultar inscripciones:', err);
    res.status(500).json({ ok: false, message: 'Error al consultar inscripciones.' });
  }
});

//REGISTRAR ASISTENCIA 
const asistenciaSchema = Joi.object({
  participante_id: Joi.number().integer().required(),
  taller_id: Joi.number().integer().required(),
  fecha: Joi.date().iso().required(),
  presente: Joi.boolean().required(),
  comentarios: Joi.string().allow('', null)
});

app.post('/api/asistencia', async (req, res) => {
  const { error, value } = asistenciaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, message: error.details[0].message });
  }
  const { participante_id, taller_id, fecha, presente, comentarios } = value;

  try {
    // Puedes decidir si permites modificar o solo crear una vez — aquí permitimos crear una vez por fecha
    const [dupe] = await db.query(
      'SELECT id FROM asistencia WHERE participante_id = ? AND taller_id = ? AND fecha = ?',
      [participante_id, taller_id, fecha]
    );
    if (dupe.length > 0) {
      return res.status(400).json({ ok: false, message: 'Asistencia ya registrada para este participante en esa fecha.' });
    }

    await db.query(
      'INSERT INTO asistencia (participante_id, taller_id, fecha, presente, comentarios) VALUES (?, ?, ?, ?, ?)',
      [participante_id, taller_id, fecha, presente, comentarios]
    );
    res.status(201).json({ ok: true, message: 'Asistencia registrada correctamente.' });
  } catch (err) {
    console.error('Error al registrar asistencia:', err);
    res.status(500).json({ ok: false, message: 'Error al registrar asistencia.' });
  }
});

//CONSULTAR ASISTENCIA
app.get('/api/asistencia/:tallerId', async (req, res) => {
  const tallerId = req.params.tallerId;
  try {
    const [asistencias] = await db.query(
      `SELECT a.id, a.fecha, a.presente, a.comentarios,
              i.participante_nombre, i.participante_apellido
       FROM asistencia a
       JOIN inscripciones i ON a.participante_id = i.id
       WHERE a.taller_id = ?
       ORDER BY a.fecha DESC, i.participante_apellido, i.participante_nombre`,
      [tallerId]
    );
    res.json({ ok: true, asistencias });
  } catch (err) {
    console.error('Error al obtener asistencia:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener asistencias.' });
  }
});

//REPORTES INSCRIPCIONES
const { Parser } = require('json2csv');

app.get('/api/reportes/inscripciones/:tallerId', async (req, res) => {
  const tallerId = req.params.tallerId;
  try {
    const [datos] = await db.query(`
      SELECT
        i.id AS id_inscripcion,
        i.participante_nombre,
        i.participante_apellido,
        i.fecha_nacimiento,
        t.nombre AS taller,
        tu.nombre AS nombre_tutor,
        tu.apellido AS apellido_tutor,
        tu.email AS email_tutor,
        i.fecha_inscripcion,
        i.estado
      FROM inscripciones i
      JOIN talleres t ON i.taller_id = t.id
      JOIN tutores tu ON i.tutor_id = tu.id
      WHERE t.id = ?
    `, [tallerId]);

    // Si no hay datos, avisa
    if (!datos || datos.length === 0) {
      return res.status(404).json({ ok: false, message: 'No hay inscripciones para este taller.' });
    }

    // Forma el CSV
    const parser = new Parser();
    const csv = parser.parse(datos);

    // Prepara la descarga
    res.header('Content-Type', 'text/csv');
    res.attachment(`reporte_inscripciones_taller_${tallerId}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('Error al generar reporte:', err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte.' });
  }
});

//REPORTES ASISTENCIA
app.get('/api/reportes/asistencia/:tallerId', async (req, res) => {
  const tallerId = req.params.tallerId;
  try {
    const [datos] = await db.query(`
      SELECT
        a.fecha,
        i.participante_nombre,
        i.participante_apellido,
        i.fecha_nacimiento,
        a.presente,
        a.comentarios,
        t.nombre AS taller
      FROM asistencia a
      JOIN inscripciones i ON a.participante_id = i.id
      JOIN talleres t ON a.taller_id = t.id
      WHERE t.id = ?
      ORDER BY a.fecha DESC, i.participante_apellido, i.participante_nombre
    `, [tallerId]);

    if (!datos || datos.length === 0) {
      return res.status(404).json({ ok: false, message: 'No hay asistencias para este taller.' });
    }

    const parser = new Parser();
    const csv = parser.parse(datos);

    res.header('Content-Type', 'text/csv');
    res.attachment(`reporte_asistencia_taller_${tallerId}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('Error al generar reporte de asistencia:', err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte de asistencia.' });
  }
});

//SIMULACION PAGOS
app.post('/api/pagos/simulado', async (req, res) => {
  const { inscripcion_id, tutor_id, monto } = req.body;
  try {
    // Marca la inscripción como pagada y guarda el pago simulado
    await db.query(
      `INSERT INTO pagos (inscripcion_id, tutor_id, monto, metodo, status)
       VALUES (?, ?, ?, 'simulado', 'realizado')`,
      [inscripcion_id, tutor_id, monto]
    );

    // Opcional: Actualiza estado en inscripciones si lo quieres reflejar
    await db.query(
      `UPDATE inscripciones SET estado = 'pagado' WHERE id = ?`,
      [inscripcion_id]
    );

    res.json({ ok: true, mensaje: 'Pago simulado registrado. La inscripción está pagada.' });
  } catch (err) {
    console.error('Error en pago simulado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el pago simulado.' });
  }
});

//LOGIN
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretoSuperSeguroYunico';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Busca el tutor en BD
    const [rows] = await db.query('SELECT * FROM tutores WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos" });
    }
    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT (puedes extenderlo para roles)
    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol || 'tutor' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ ok: true, token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol || 'tutor' } });
  } catch (err) {
    console.error("Error al hacer login:", err);
    res.status(500).json({ ok: false, message: "Error interno en login." });
  }
});

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ ok: false, message: "No autenticado" });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
}

// Ejemplo: proteger un endpoint solo para autentificados
//hago esto una vez obtenido el token
app.get('/api/privado', authMiddleware, (req, res) => {
  res.json({ ok: true, message: "¡Acceso permitido!", usuario: req.usuario });
});

//INSCRIPCIONES TUTOR
// /api/inscripciones/tutor/:tutorId
app.get('/api/inscripciones/tutor/:tutorId', authMiddleware, async (req, res) => {
  const tutorId = req.params.tutorId;
  try {
    const [inscripciones] = await db.query(
      `SELECT
        i.id, i.participante_nombre, i.participante_apellido, i.fecha_nacimiento,
        t.nombre as taller, t.fecha_inicio, t.fecha_fin,
        i.fecha_inscripcion, i.estado
      FROM inscripciones i
      JOIN talleres t ON i.taller_id = t.id
      WHERE i.tutor_id = ?
      ORDER BY i.fecha_inscripcion DESC`, [tutorId]);
    res.json({ ok: true, inscripciones });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error al obtener inscripciones" });
  }
});

//CANCELACION
app.put('/api/inscripciones/:id/cancelar', authMiddleware, async (req, res) => {
  const inscripcionId = req.params.id;
  const { motivo } = req.body; // Puedes guardar un motivo si lo deseas

  try {
    // Puedes verificar aquí si el estado permite cancelación, o si es del tutor logueado
    await db.query(
      "UPDATE inscripciones SET estado = 'cancelada' WHERE id = ?",
      [inscripcionId]
    );
    res.json({ ok: true, message: "Inscripción cancelada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error al cancelar inscripción" });
  }
});

//PAGOS
app.put('/api/inscripciones/:id/pagar', authMiddleware, async (req, res) => {
  const inscripcionId = req.params.id;
  let { tutorId, monto } = req.body;

  // Si faltan, intenta recuperarlos (ejemplo demo)
  if (!tutorId || !monto) {
    // Recoge el tutor y monto asociado a la inscripción (SQL extra)
    const [[insc]] = await db.query("SELECT tutor_id, 50 as monto FROM inscripciones WHERE id = ?", [inscripcionId]);
    tutorId = tutorId || insc?.tutor_id;
    monto = monto || insc?.monto || 50;
  }
  if (!tutorId || !monto) {
    return res.status(400).json({ ok: false, message: 'Falta tutorId o monto' });
  }

  try {
    await db.query("UPDATE inscripciones SET estado = 'pagado' WHERE id = ?", [inscripcionId]);
    await db.query(
      "INSERT INTO pagos (inscripcion_id, tutor_id, monto, metodo, status) VALUES (?, ?, ?, 'simulado', 'realizado')",
      [inscripcionId, tutorId, monto]
    );
    res.json({ ok: true, message: "Inscripción marcada y pago registrado." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al marcar como pagada (pago no registrado)" });
  }
});

//REPORTE DE PAGOS
app.get('/api/reportes/pagos', async (req, res) => {
  try {
    // Consulta completa: puedes filtrar por fecha, taller, tutor, ...
    const [pagos] = await db.query(`
      SELECT p.id AS id_pago,
             p.fecha_pago,
             p.monto,
             p.metodo,
             p.status,
             p.referencia,
             i.id AS id_inscripcion,
             t.nombre AS taller,
             tu.nombre AS nombre_tutor,
             tu.apellido AS apellido_tutor,
             tu.email AS email_tutor
      FROM pagos p
        JOIN inscripciones i ON p.inscripcion_id = i.id
        JOIN talleres t ON i.taller_id = t.id
        JOIN tutores tu ON p.tutor_id = tu.id
      ORDER BY p.fecha_pago DESC
    `);

  if (!pagos || pagos.length === 0) {
      return res.status(404).json({ ok: false, message: 'No hay pagos registrados.' });
    }

    // Convierte a CSV
    const parser = new Parser();
    const csv = parser.parse(pagos);

    // Descarga directa de CSV
    res.header('Content-Type', 'text/csv');
    res.attachment(`reporte_pagos.csv`);
    return res.send(csv);

  } catch (err) {
    console.error('Error al generar reporte de pagos:', err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte de pagos.' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
