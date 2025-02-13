# Documentación del Backend AcuaTerra

## Inicialización del Proyecto

1. Crear una carpeta para el proyecto llamada `Backend` y posicionarse sobre ella:
    ```sh
    cd Backend
    ```

2. Inicializar el proyecto con Node.js:
    ```sh
    npm init -y
    ```

3. Instalar las dependencias necesarias:
    ```sh
    npm install express body-parser bcryptjs jsonwebtoken dotenv mysql2
    ```

4. Crear un archivo [db.js](http://_vscodecontentref_/1) para configurar la conexión a la base de datos:
    ```javascript
    const mysql = require('mysql2/promise');
    const dotenv = require('dotenv');
    require('dotenv').config(); // Para cargar las variables de entorno desde el archivo .env

    dotenv.config();

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3305, // Usa 3306 como predeterminado si no se especifica en el .env
    });

    module.exports = pool;
    ```

5. Crear la base de datos `acuaterra_db` con una tabla `usuarios`:
    ```sql
    CREATE TABLE usuarios (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        email VARCHAR(100),
        password VARCHAR(255),
        id_rol INT,
        n_documento_identidad VARCHAR(255),
        sede VARCHAR(255),
        n_ficha VARCHAR(255),
        jornada VARCHAR(255),
        nombre_del_programa VARCHAR(255)
    );
    ```

6. Crear un archivo [index.js](http://_vscodecontentref_/2) para configurar Express:
    ```javascript
    const express = require('express');
    const bodyParser = require('body-parser');
    const dotenv = require('dotenv');
    const userRoutes = require('./routes/users');
    const cors = require('cors');
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/users', userRoutes);
    dotenv.config();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
    ```

7. Crear un archivo [users.js](http://_vscodecontentref_/3) para manejar las rutas de usuarios:
    ```javascript
    const express = require("express");
    const bcrypt = require("bcryptjs");
    const jwt = require("jsonwebtoken");
    const { body, validationResult } = require("express-validator");
    const pool = require("../db");
    const router = express.Router();
    require('dotenv').config();
    const JWT_SECRET = process.env.JWT_SECRET;

    router.post("/register", [
        body("nombre").notEmpty().withMessage("El nombre es requerido"),
        body("email").isEmail().withMessage("El email no es válido"),
        body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
        body("n_documento_identidad").notEmpty().withMessage("El número de documento de identidad es requerido"),
        body("sede").notEmpty().withMessage("La sede es requerida"),
        body("n_ficha").notEmpty().withMessage("El número de ficha es requerido"),
        body("jornada").notEmpty().withMessage("La jornada es requerida"),
        body("nombre_del_programa").notEmpty().withMessage("El nombre del programa es requerido"),
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { nombre, email, password, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa } = req.body;
            const [existingUser] = await pool.query("SELECT * FROM usuario WHERE email = ?", [email]);
            if (existingUser.length > 0) {
                return res.status(400).json({ error: "El usuario ya existe" });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const id_rol = 2;
            const sql = `INSERT INTO usuario (nombre, email, password, id_rol, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [nombre, email, hashedPassword, id_rol, n_documento_identidad, sede, n_ficha, jornada, nombre_del_programa];
            await pool.query(sql, values);
            res.status(200).json({ message: 'Usuario registrado exitosamente' });
        } catch (error) {
            console.error("Error al registrar el usuario:", error);
            res.status(500).json({ error: "Error al registrar el usuario" });
        }
    });

    router.post('/login', [
        body('email').isEmail().withMessage('El email no es válido'),
        body('password').notEmpty().withMessage('La contraseña es requerida')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        try {
            const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(400).json({ message: 'Credenciales inválidas' });
            }
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Credenciales inválidas' });
            }
            const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token });
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            res.status(500).json({ error: 'Error al iniciar sesión' });
        }
    });

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
    ```

8. Crear un archivo [.env](http://_vscodecontentref_/4) para las variables de entorno:
    ```
    JWT_SECRET=your_jwt_secret
    DB_HOST=localhost
    DB_USER=user
    DB_PASSWORD=root
    DB_NAME=acuaterra_db
    DB_PORT=3305
    ```

9. Añadir el script para levantar el servidor en modo desarrollo en `package.json`:
    ```json
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js"
    }
    ```

10. Levantar el servidor:
    ```sh
    npm run dev
    ```

## Endpoints de la API

- **POST /api/users/register**: Registro de usuario
- **POST /api/users/login**: Inicio de sesión
- **GET /api/users/usuarios**: Obtener todos los usuarios