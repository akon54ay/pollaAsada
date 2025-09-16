const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// Validaciones
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'caja', 'cocina', 'mozo']).withMessage('Rol inválido')
];

const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario o email es requerido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// Rutas públicas
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Rutas protegidas
router.get('/profile', verifyToken, authController.getProfile);
router.post('/change-password', verifyToken, validateChangePassword, authController.changePassword);

module.exports = router;
