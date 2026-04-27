#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, syncDatabase } = require('../models');

async function main() {
  console.log('\n🔄 Synchronisation des tables MySQL...');
  await sequelize.authenticate();
  console.log('✅ MySQL connecté');
  await syncDatabase();
  console.log('✅ Toutes les tables ont été créées/mises à jour.');
  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
