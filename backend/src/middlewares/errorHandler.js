// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }

  // Error de unicidad de Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} ya existe`
    }));
    return res.status(400).json({
      success: false,
      message: 'Error de duplicación',
      errors
    });
  }

  // Error de base de datos de Sequelize
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error por defecto
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};
