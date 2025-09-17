const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_pedido: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  mesa: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  cliente_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_pedido: {
    type: DataTypes.ENUM('local', 'llevar', 'delivery'),
    defaultValue: 'local'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'),
    defaultValue: 'pendiente'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  fecha_pendiente: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_preparando: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_listo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_entregado: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (pedido) => {
      // Generar número de pedido único si no existe
      if (!pedido.numero_pedido) {
        const fecha = new Date();
        const year = fecha.getFullYear().toString().substr(-2);
        const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const day = fecha.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        pedido.numero_pedido = `P${year}${month}${day}-${random}`;
      }
    }
  }
});

module.exports = Pedido;
