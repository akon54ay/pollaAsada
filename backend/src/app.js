const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Obtener origins permitidos del .env
const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';

// Lista de orígenes permitidos
const allowedOriginsList = [
  "http://localhost:3000", // React development server
  "http://localhost:5173", // Vite development server
  "http://localhost:5174", // Vite development server (puerto alternativo)
  "http://localhost:5175", // Vite development server (puerto alternativo 2)
  "http://172.80.15.84:3000",
  "http://172.80.15.84:5173",
  "http://172.80.15.84:5174",
  "http://172.80.15.84:5175",
  "http://172.80.15.84:8080", // Backend server
  "http://172.80.15.37:5173", // Cliente remoto
  "http://172.80.15.37:5174", // Cliente remoto (puerto alternativo)
  "http://172.80.15.37:5175", // Cliente remoto (puerto alternativo 2)
  "http://192.168.56.1:5173", // Cliente remoto (corrección de IP)
  "http://192.168.56.1:5174", // Cliente remoto (puerto alternativo)
  "http://192.168.56.1:5175", // Cliente remoto (puerto alternativo 2)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman o aplicaciones móviles)
    if (!origin) {
      return callback(null, true);
    }
    
    // Si ALLOWED_ORIGINS del .env es *, permitir todos
    if (allowedOrigins === '*') {
      return callback(null, true);
    }
    
    // Verificar si el origin está en la lista de permitidos
    if (allowedOriginsList.includes(origin)) {
      callback(null, true);
    } else {
      // También verificar los origins del .env si existen
      const envOrigins = allowedOrigins.split(',').map(o => o.trim());
      if (envOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS bloqueado para:', origin);
        callback(new Error('No permitido por CORS'));
      }
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
