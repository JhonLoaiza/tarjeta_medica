// backend/routes.js
const express = require("express");
const router = express.Router();
const pool = require("./db");

// Util: validaciones simples
function validarRegistro(body) {
  const errors = [];
  if (!body.rut || body.rut.trim().length < 3) errors.push("RUT inválido");
  if (!body.nombres || body.nombres.trim().length < 2) errors.push("Nombres obligatorios");
  if (!body.apellidos || body.apellidos.trim().length < 2) errors.push("Apellidos obligatorios");
  if (!body.direccion || body.direccion.trim().length < 3) errors.push("Dirección obligatoria");
  if (!body.ciudad || body.ciudad.trim().length < 2) errors.push("Ciudad obligatoria");
  if (!body.telefono || !/^[0-9+()\-\s]+$/.test(body.telefono)) errors.push("Teléfono inválido");
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push("Email inválido");
  if (!body.fechaNacimiento) errors.push("Fecha de nacimiento obligatoria");
  if (!body.estadoCivil) errors.push("Estado civil obligatorio");
  return errors;
}

// Check existence (por RUT)
router.get("/check/:rut", async (req, res) => {
  const rut = req.params.rut;
  try {
    const [rows] = await pool.execute("SELECT rut FROM paciente WHERE rut = ?", [rut]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

// Guardar (insert / update)
// Si el registro existe y body.overwrite !== true, devuelve exists:true para que cliente confirme.
router.post("/guardar", async (req, res) => {
  const body = req.body;
  const errors = validarRegistro(body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const {
    rut, nombres, apellidos, direccion, ciudad, telefono,
    email, fechaNacimiento, estadoCivil, comentarios, overwrite
  } = body;

  try {
    const [rows] = await pool.execute("SELECT rut FROM paciente WHERE rut = ?", [rut]);
    const exists = rows.length > 0;

    if (exists && !overwrite) {
      // Indica al cliente que existe y no sobrescribimos sin permiso
      return res.json({ success: false, exists: true, message: "Registro ya existe. Confirma sobrescribir." });
    }

    if (exists && overwrite) {
      // UPDATE
      await pool.execute(
        `UPDATE paciente SET nombres=?, apellidos=?, direccion=?, ciudad=?, telefono=?, email=?, fecha_nacimiento=?, estado_civil=?, comentarios=? WHERE rut=?`,
        [nombres, apellidos, direccion, ciudad, telefono, email, fechaNacimiento, estadoCivil, comentarios, rut]
      );
      return res.json({ success: true, message: "Registro actualizado correctamente" });
    }

    // Insertar
    await pool.execute(
      `INSERT INTO paciente (rut, nombres, apellidos, direccion, ciudad, telefono, email, fecha_nacimiento, estado_civil, comentarios)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rut, nombres, apellidos, direccion, ciudad, telefono, email, fechaNacimiento, estadoCivil, comentarios]
    );
    return res.json({ success: true, message: "Registro guardado correctamente" });

  } catch (err) {
    console.error("Error en /guardar:", err);
    return res.status(500).json({ success: false, error: "Error en servidor" });
  }
});

// Buscar por apellido
router.get("/buscar", async (req, res) => {
  const apellido = req.query.apellido || "";
  try {
    const [rows] = await pool.execute("SELECT rut, nombres, apellidos, ciudad, telefono, email, fecha_nacimiento as fechaNacimiento, estado_civil as estadoCivil, comentarios FROM paciente WHERE apellidos LIKE ?", [`%${apellido}%`]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

module.exports = router;
