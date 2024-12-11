const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const express = require('express');
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