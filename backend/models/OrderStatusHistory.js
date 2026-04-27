const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50)
  },
  changedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  changedByRole: {
    type: DataTypes.STRING(50)
  },
  note: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'order_status_history',
  updatedAt: false
});

module.exports = OrderStatusHistory;
