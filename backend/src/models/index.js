const { sequelize } = require('../config/db');
const User = require('./User');
const Menu = require('./Menu');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Pago = require('./Pago');
const HistorialPedido = require('./HistorialPedido');

// Definir relaciones

// Usuario - Pedido
User.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });
Pedido.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// Pedido - DetallePedido
Pedido.hasMany(DetallePedido, { foreignKey: 'pedido_id', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Menu - DetallePedido
Menu.hasMany(DetallePedido, { foreignKey: 'menu_id', as: 'detalles' });
DetallePedido.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });

// Pedido - Pago
Pedido.hasOne(Pago, { foreignKey: 'pedido_id', as: 'pago' });
Pago.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Usuario - Pago
User.hasMany(Pago, { foreignKey: 'usuario_id', as: 'pagos' });
Pago.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// Pedido - HistorialPedido
Pedido.hasMany(HistorialPedido, { foreignKey: 'pedido_id', as: 'historial' });
HistorialPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Usuario - HistorialPedido
User.hasMany(HistorialPedido, { foreignKey: 'usuario_id', as: 'historiales' });
HistorialPedido.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  User,
  Menu,
  Pedido,
  DetallePedido,
  Pago,
  HistorialPedido
};
