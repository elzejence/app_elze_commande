const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderRole: {
    type: DataTypes.ENUM('client', 'employee', 'admin')
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recipientRole: {
    type: DataTypes.ENUM('client', 'employee', 'admin')
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('address', 'note', 'inquiry', 'reply', 'general', 'order_update'),
    defaultValue: 'general'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages'
});

module.exports = Message;
