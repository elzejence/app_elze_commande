const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    define: {
      timestamps: true,
      underscored: false
    },

    // 🔒 SSL (activé seulement si DB_SSL=true)
    dialectOptions: process.env.DB_SSL === 'true'
      ? {
          ssl: {
            rejectUnauthorized:true
          }
        }
      : {}
  }
);

// 🔁 Test de connexion
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion DB :', error.message);
  }
})();

module.exports = sequelize;