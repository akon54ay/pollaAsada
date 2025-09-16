const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.ENUM('entrada', 'plato_principal', 'bebida', 'postre', 'adicional'),
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  imagen_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tiempo_preparacion: {
    type: DataTypes.INTEGER, // en minutos
    defaultValue: 15
  }
}, {
  timestamps: true
});

module.exports = Menu;
