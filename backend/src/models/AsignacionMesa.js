const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AsignacionMesa = sequelize.define('AsignacionMesa', {
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
  mesa_numero: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_liberacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activa', 'finalizada'),
    defaultValue: 'activa'
  },
  turno: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'AsignacionMesas',
  indexes: [
    {
      fields: ['mozo_id', 'mesa_numero']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['fecha_asignacion']
    }
  ]
});

module.exports = AsignacionMesa;
