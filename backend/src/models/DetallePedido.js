const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DetallePedido = sequelize.define('DetallePedido', {
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
  menu_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Menus',
      key: 'id'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (detalle) => {
      detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
    }
  }
});

module.exports = DetallePedido;
