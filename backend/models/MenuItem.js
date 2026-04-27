const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Entrées', 'Plats principaux', 'Desserts', 'Boissons', 'Snacks', 'Menus spéciaux'),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(500),
    defaultValue: ''
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastModifiedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'menu_items'
});

module.exports = MenuItem;
