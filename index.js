const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const cors = require('cors');
const app = express();
app.use(cors());

app.use(express.json()); // Permite manejar datos JSON en las solicitudes

app.use('/api/users', userRoutes);

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



