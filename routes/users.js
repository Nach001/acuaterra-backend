const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Importa la conexión a la base de datos
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {

    try {
        const { nombre,
                email,
                password,
                n_documento_identidad,
                sede,
                n_ficha,
                jornada,
                nombre_del_programa} = req.body;
        // Verificar si el usuario ya existe
        const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya está registrado' });
        }
         // Validar que todos los campos están presentes
        if (!nombre || !email || !password || !n_documento_identidad || !sede || !n_ficha || !jornada || !nombre_del_programa) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardar el usuario en la base de datos
        await pool.query('INSERT INTO usuario () VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [nombre, email, hashedPassword, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa]);

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
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
        }  // Generar un token JWT
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
    });

      

    // Obtener todos los usuarios
    router.get('/usuarios', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM usuario');
            res.status(200).json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener los usuarios' });
        }
    });


module.exports = router;

