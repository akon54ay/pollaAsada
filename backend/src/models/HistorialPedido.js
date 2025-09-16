const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HistorialPedido = sequelize.define('HistorialPedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pedidos',
      key: 'id'
    }
  },
  estado_anterior: {
    type: DataTypes.ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'),
    allowNull: true
  },
  estado_nuevo: {
    type: DataTypes.ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'),
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

module.exports = HistorialPedido;
