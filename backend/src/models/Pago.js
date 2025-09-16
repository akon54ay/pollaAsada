const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Pago = sequelize.define('Pago', {
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
  numero_ticket: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'),
    allowNull: false
  },
  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  monto_recibido: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cambio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (pago) => {
      // Generar número de ticket único
      const fecha = new Date();
      const year = fecha.getFullYear().toString().substr(-2);
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      pago.numero_ticket = `T${year}${month}${day}-${random}`;
      
      // Calcular cambio si es efectivo
      if (pago.metodo_pago === 'efectivo' && pago.monto_recibido) {
        pago.cambio = pago.monto_recibido - pago.monto_total;
      }
    }
  }
});

module.exports = Pago;
