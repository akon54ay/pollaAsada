const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    
    // Permitir requests sin origin (ej: Postman, aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    // Si ALLOWED_ORIGINS es *, permitir todos
    if (allowedOrigins === '*') {
      return callback(null, true);
    }
    
    // Verificar si el origin está en la lista de permitidos
    const origins = allowedOrigins.split(',').map(o => o.trim());
    if (origins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares globales
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const cocinaRoutes = require('./routes/cocinaRoutes');
const mozoRoutes = require('./routes/mozoRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/cocina', cocinaRoutes);
app.use('/api/mozo', mozoRoutes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

module.exports = app;
