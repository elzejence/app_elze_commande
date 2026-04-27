require('dotenv').config();
const { sequelize, User } = require('../models');

async function main() {
  await sequelize.authenticate();
  
  // Check if admin exists
  const existing = await User.findOne({ where: { role: 'admin' } });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await sequelize.close();
    process.exit(0);
  }
  
  // Create admin
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@restaurant.com',
    password: 'admin123',
    phone: '',
    role: 'admin'
  });
  
  console.log('Admin created:', admin.email);
  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});