const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/payments_db',
  {
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = { sequelize };
