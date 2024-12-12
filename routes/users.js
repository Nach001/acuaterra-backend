const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db"); // Importa la conexión a la base de datos
const router = express.Router();

require('dotenv').config(); // Cargar variables de entorno

const JWT_SECRET = process.env.JWT_SECRET; // Usar la clave secreta desde el archivo .env
// Registro de usuario
router.post(
  "/register",
  [
    // Validaciones
    body("nombre").notEmpty().withMessage("El nombre es requerido"),
    body("email").isEmail().withMessage("El email no es válido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("n_documento_identidad")
      .notEmpty()
      .withMessage("El número de documento de identidad es requerido"),
    body("sede").notEmpty().withMessage("La sede es requerida"),
    body("n_ficha").notEmpty().withMessage("El número de ficha es requerido"),
    body("jornada").notEmpty().withMessage("La jornada es requerida"),
    body("nombre_del_programa")
      .notEmpty()
      .withMessage("El nombre del programa es requerido"),
  ],
  async (req, res) => {
    // Manejo de errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        nombre,
        email,
        password,
        n_documento_identidad,
        sede,
        n_ficha,
        jornada,
        nombre_del_programa,
      } = req.body;
      // Verificar si el usuario ya existe
      const [existingUser] = await pool.query(
        "SELECT * FROM usuario WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt); //para incriptar

      const id_rol = 2; // Por ejemplo, 2 puede ser el rol de "usuario" o "cliente"

        // Insertar el nuevo usuario en la base de datos
        const sql = `
            INSERT INTO usuario (nombre, email, password, id_rol, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [nombre, email, hashedPassword, id_rol, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa];

        // Ejecutar la consulta SQL para insertar el usuario en la base de datos
        await pool.query(sql, values);

        res.status(200).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      res.status(500).json({ error: "Error al registrar el usuario" });
    }
  }
);

// Login de usuario
router.post('/login', [
    // Validaciones
    body('email').isEmail().withMessage('El email no es válido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    // Manejo de errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe
        const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const user = rows[0];

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        // Devolver el token JWT al cliente
        res.status(200).json({ token });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuario");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
});

module.exports = router;
