const express = require('express');
const router = express.Router();
const mozoController = require('../controllers/mozoController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol de mozo o admin
router.use(verifyToken);
router.use(checkRole('admin', 'mozo'));

// Obtener pedidos listos para entrega
router.get('/pedidos-listos', mozoController.getPedidosListos);

// Marcar pedido como entregado
router.patch('/pedido/:id/entregado', mozoController.marcarComoEntregado);

// Obtener pedidos por mesa
router.get('/mesa/:mesa/pedidos', mozoController.getPedidosPorMesa);

// Obtener mesas activas
router.get('/mesas-activas', mozoController.getMesasActivas);

// Obtener estadísticas del mozo
router.get('/estadisticas', mozoController.getEstadisticasMozo);

module.exports = router;
