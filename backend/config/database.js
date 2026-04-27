const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration centralisée
const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  dialect: 'mysql',

  logging: false, // mettre console.log si debug

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

  dialectOptions: {
    ssl: process.env.DB_SSL === 'true'
      ? {

          rejectUnauthorized: true
        }
      : false
  }
};

// Initialisation Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// 🔁 Fonction pour tester la connexion
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données :', error.message);
    process.exit(1); // stop le serveur si DB KO
  }
};

module.exports = {
  sequelize,
  connectDB
};