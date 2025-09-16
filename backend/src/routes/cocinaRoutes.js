const express = require('express');
const router = express.Router();
const cocinaController = require('../controllers/cocinaController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol de cocina o admin
router.use(verifyToken);
router.use(checkRole('admin', 'cocina'));

// Obtener pedidos pendientes y en preparación
router.get('/pedidos-pendientes', cocinaController.getPedidosPendientes);

// Iniciar preparación de un pedido
router.patch('/pedido/:id/iniciar', cocinaController.iniciarPreparacion);

// Marcar pedido como listo
router.patch('/pedido/:id/listo', cocinaController.marcarComoListo);

// Obtener estadísticas de cocina
router.get('/estadisticas', cocinaController.getEstadisticasCocina);

// Obtener productos más pedidos del día
router.get('/productos-mas-pedidos', cocinaController.getProductosMasPedidos);

module.exports = router;
