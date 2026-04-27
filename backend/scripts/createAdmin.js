#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const readline = require('readline');
const { sequelize, syncDatabase, User } = require('../models');

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Création du compte Administrateur  ║');
  console.log('╚══════════════════════════════════════╝\n');

  await sequelize.authenticate();
  console.log('✅ MySQL connecté\n');
  await syncDatabase();

  const existing = await User.findOne({ where: { role: 'admin' } });
  if (existing) {
    const cont = await ask(`⚠️  Admin existant: ${existing.email}. Créer un autre? (oui/non): `);
    if (cont.toLowerCase() !== 'oui') {
      rl.close(); await sequelize.close(); process.exit(0);
    }
  }

  const name     = await ask('Nom complet    : ');
  const email    = await ask('Email          : ');
  const password = await ask('Mot de passe   : ');
  const phone    = await ask('Téléphone      : ');

  if (!name || !email || password.length < 6) {
    console.log('❌ Données invalides (mot de passe min. 6 caractères).');
    rl.close(); await sequelize.close(); process.exit(1);
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    console.log('❌ Email déjà utilisé.');
    rl.close(); await sequelize.close(); process.exit(1);
  }

  const admin = await User.create({ name, email, password, phone, role: 'admin' });

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      ✅  Administrateur créé !        ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  Nom   : ${admin.name}`);
  console.log(`  Email : ${admin.email}`);
  console.log(`  ID    : ${admin.id}`);
  console.log('\n→ Connectez-vous sur http://localhost:3000/login\n');

  rl.close();
  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
