const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cajaController = require('../controllers/cajaController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Validaciones
const validatePago = [
  body('pedido_id')
    .notEmpty().withMessage('ID del pedido requerido')
    .isInt().withMessage('ID del pedido debe ser un número'),
  body('metodo_pago')
    .notEmpty().withMessage('Método de pago requerido')
    .isIn(['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'])
    .withMessage('Método de pago inválido'),
  body('monto_recibido')
    .if(body('metodo_pago').equals('efectivo'))
    .notEmpty().withMessage('Monto recibido requerido para pagos en efectivo')
    .isFloat({ min: 0 }).withMessage('Monto recibido debe ser un número positivo')
];

const validatePedidoConPago = [
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
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('metodo_pago')
    .notEmpty().withMessage('Método de pago requerido')
    .isIn(['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'])
    .withMessage('Método de pago inválido'),
  body('monto_recibido')
    .if(body('metodo_pago').equals('efectivo'))
    .notEmpty().withMessage('Monto recibido requerido para pagos en efectivo')
    .isFloat({ min: 0 }).withMessage('Monto recibido debe ser un número positivo')
];

// Todas las rutas requieren autenticación y rol de caja o admin
router.use(verifyToken);
router.use(checkRole('admin', 'caja'));

// Registrar pago de un pedido existente
router.post('/pago', validatePago, cajaController.registrarPago);

// Crear pedido con pago (todo en uno)
router.post('/pedido-con-pago', validatePedidoConPago, cajaController.crearPedidoConPago);

// Obtener ticket
router.get('/ticket/:numero_ticket', cajaController.getTicket);

// Obtener resumen de caja
router.get('/resumen', cajaController.getResumenCaja);

module.exports = router;
