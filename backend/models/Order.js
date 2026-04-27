const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(20),
    unique: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('delivery', 'pickup'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  paymentMethod: {
    type: DataTypes.ENUM('online', 'cash'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid'),
    defaultValue: 'pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  clientNote: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  validatedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'orders',
  hooks: {
    beforeCreate: async (order) => {
      // Auto-generate order number
      const count = await Order.count();
      order.orderNumber = `CMD-${String(count + 1).padStart(4, '0')}`;
    }
  }
});

module.exports = Order;
