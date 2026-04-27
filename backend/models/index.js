const sequelize = require('../config/database');
const User              = require('./User');
const MenuItem          = require('./MenuItem');
const Order             = require('./Order');
const OrderItem         = require('./OrderItem');
const OrderStatusHistory= require('./OrderStatusHistory');
const Message           = require('./Message');
const ActivityLog       = require('./ActivityLog');

// ── ASSOCIATIONS ─────────────────────────────────────────────────────────────

// User self-reference (createdBy)
User.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

// Order ↔ User (client)
Order.belongsTo(User, { as: 'client',       foreignKey: 'clientId' });
Order.belongsTo(User, { as: 'validatedBy',  foreignKey: 'validatedById' });
User.hasMany(Order,   { as: 'orders',        foreignKey: 'clientId' });

// Order ↔ OrderItems
Order.hasMany(OrderItem,    { as: 'items',  foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order,  { foreignKey: 'orderId' });
OrderItem.belongsTo(MenuItem, { as: 'menuItem', foreignKey: 'menuItemId' });

// Order ↔ StatusHistory
Order.hasMany(OrderStatusHistory,     { as: 'statusHistory', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order,   { foreignKey: 'orderId' });
OrderStatusHistory.belongsTo(User,    { as: 'changedBy', foreignKey: 'changedById' });

// MenuItem ↔ User (lastModifiedBy)
MenuItem.belongsTo(User, { as: 'lastModifiedBy', foreignKey: 'lastModifiedById' });

// Message ↔ User
Message.belongsTo(User,  { as: 'sender',    foreignKey: 'senderId' });
Message.belongsTo(User,  { as: 'recipient', foreignKey: 'recipientId' });
Message.belongsTo(Order, { as: 'order',     foreignKey: 'orderId' });

// ActivityLog ↔ User
ActivityLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(ActivityLog,   { foreignKey: 'userId' });

// ── SYNC ─────────────────────────────────────────────────────────────────────
// alter: true → met à jour les tables sans supprimer les données
const syncDatabase = async () => {
  console.log('⚠️ Sync en mode sécurisé (sans modification de structure)');
  await sequelize.sync(); // 🔥 zéro alter, zéro force
  console.log('✅ Tables synchronisées');
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  MenuItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Message,
  ActivityLog
};
