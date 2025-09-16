const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole, optionalAuth } = require('../middlewares/auth');

// Validaciones
const validateMenuItem = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido'),
  body('categoria')
    .notEmpty().withMessage('La categoría es requerida')
    .isIn(['entrada', 'plato_principal', 'bebida', 'postre', 'adicional'])
    .withMessage('Categoría inválida'),
  body('precio')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('tiempo_preparacion')
    .optional()
    .isInt({ min: 1 }).withMessage('El tiempo de preparación debe ser un número entero positivo')
];

// Rutas públicas (con autenticación opcional para mostrar precios especiales si está logueado)
router.get('/', optionalAuth, menuController.getMenuItems);
router.get('/:id', optionalAuth, menuController.getMenuItem);

// Rutas protegidas - Solo admin puede modificar el menú
router.post('/', 
  verifyToken, 
  checkRole('admin'), 
  validateMenuItem, 
  menuController.createMenuItem
);

router.put('/:id', 
  verifyToken, 
  checkRole('admin'), 
  validateMenuItem, 
  menuController.updateMenuItem
);

router.delete('/:id', 
  verifyToken, 
  checkRole('admin'), 
  menuController.deleteMenuItem
);

router.patch('/:id/toggle-availability', 
  verifyToken, 
  checkRole('admin', 'cocina'), 
  menuController.toggleAvailability
);

module.exports = router;
