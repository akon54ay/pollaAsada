const express = require('express');
const router = express.Router();
const mozoController = require('../controllers/mozoController');
const { verifyToken, checkRole, optionalAuth } = require('../middlewares/auth');

// Rutas públicas (no requieren autenticación)
// Obtener mesas activas - público para que los clientes puedan ver qué mesas están ocupadas
router.get('/mesas-activas', optionalAuth, mozoController.getMesasActivas);

// Verificar estado de una mesa específica - público para validación en tiempo real
router.get('/mesa/:numeroMesa/estado', optionalAuth, mozoController.verificarEstadoMesa);

// Rutas protegidas - requieren autenticación y rol de mozo o admin
// Obtener pedidos listos para entrega
router.get('/pedidos-listos', verifyToken, checkRole('admin', 'mozo'), mozoController.getPedidosListos);

// Marcar pedido como entregado
router.patch('/pedido/:id/entregado', verifyToken, checkRole('admin', 'mozo'), mozoController.marcarComoEntregado);

// Obtener pedidos por mesa
router.get('/mesa/:mesa/pedidos', verifyToken, checkRole('admin', 'mozo'), mozoController.getPedidosPorMesa);

// Obtener estadísticas del mozo
router.get('/estadisticas', verifyToken, checkRole('admin', 'mozo'), mozoController.getEstadisticasMozo);

// Rutas para sistema de múltiples mozos
// Obtener notificaciones del mozo
router.get('/notificaciones', verifyToken, checkRole('admin', 'mozo'), mozoController.getNotificaciones);

// Marcar notificación como leída
router.patch('/notificacion/:id/leida', verifyToken, checkRole('admin', 'mozo'), mozoController.marcarNotificacionLeida);

// Asignar mesa a mozo
router.post('/asignar-mesa', verifyToken, checkRole('admin', 'mozo'), mozoController.asignarMesa);

// Liberar mesa
router.post('/liberar-mesa/:mesa_numero', verifyToken, checkRole('admin', 'mozo'), mozoController.liberarMesa);

// Obtener mozos disponibles
router.get('/mozos-disponibles', optionalAuth, mozoController.getMozosDisponibles);

// Obtener estadísticas de todos los mozos (para admin)
router.get('/estadisticas-todos', verifyToken, checkRole('admin'), mozoController.getEstadisticasTodosMozos);

module.exports = router;
