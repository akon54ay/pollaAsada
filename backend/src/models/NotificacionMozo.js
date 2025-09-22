const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NotificacionMozo = sequelize.define('NotificacionMozo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mozo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('mesa_liberada', 'pedido_listo', 'nueva_asignacion', 'cambio_turno', 'alerta'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mesa_numero: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Pedidos',
      key: 'id'
    }
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_leida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  }
}, {
  timestamps: true,
  tableName: 'NotificacionesMozo',
  indexes: [
    {
      fields: ['mozo_id', 'leida']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = NotificacionMozo;
