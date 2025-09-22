const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pedidoController = require('../controllers/pedidoController');
const { verifyToken, checkRole, optionalAuth } = require('../middlewares/auth');

// Validaciones
const validatePedido = [
  body('tipo_pedido')
    .optional()
    .isIn(['local', 'llevar', 'delivery']).withMessage('Tipo de pedido inválido'),
  body('detalles')
    .isArray({ min: 1 }).withMessage('El pedido debe tener al menos un producto'),
  body('detalles.*.menu_id')
    .notEmpty().withMessage('ID del menú requerido')
    .isInt().withMessage('ID del menú debe ser un número'),
  body('detalles.*.cantidad')
    .notEmpty().withMessage('Cantidad requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1')
];

const validateEstadoUpdate = [
  body('estado')
    .notEmpty().withMessage('Estado requerido')
    .isIn(['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'])
    .withMessage('Estado inválido')
];

// Rutas públicas (pueden ser usadas sin autenticación)
// Crear pedido - público para clientes, pero con autenticación opcional
router.post('/', 
  optionalAuth,  // Autenticación opcional
  validatePedido, 
  pedidoController.createPedido
);

// Rutas protegidas - requieren autenticación
// Obtener pedidos - requiere autenticación
router.get('/', verifyToken, pedidoController.getPedidos);
router.get('/:id', verifyToken, pedidoController.getPedido);

// Actualizar estado - según el rol
router.patch('/:id/estado', 
  verifyToken,
  validateEstadoUpdate, 
  pedidoController.updateEstadoPedido
);

// Actualizar solo observaciones - admin y caja
router.patch('/:id', 
  verifyToken,
  checkRole('admin', 'caja'),
  pedidoController.updatePedido
);

// Cancelar pedido - admin y caja
router.post('/:id/cancelar', 
  verifyToken,
  checkRole('admin', 'caja'), 
  pedidoController.cancelarPedido
);

module.exports = router;
