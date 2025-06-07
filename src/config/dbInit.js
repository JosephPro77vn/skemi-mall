const { sequelize } = require('./database');
const { seedDatabase } = require('./seedData');
const models = require('../models');

/**
 * Initialize the database by syncing models and seeding data
 */
const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully!');
    
    // Seed the database with initial data
    await seedDatabase();
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };

