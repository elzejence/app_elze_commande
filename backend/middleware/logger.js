const { ActivityLog } = require('../models');

const logActivity = async (userId, action, details = '') => {
  try {
    await ActivityLog.create({ userId, action, details });
  } catch (e) {
    // Non-blocking — don't crash if log fails
    console.error('ActivityLog error:', e.message);
  }
};

module.exports = { logActivity };
