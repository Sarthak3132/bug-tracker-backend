require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://Sarthak31:bbVbl6lhMRVYnLPm@bugtracker.j8qt3bp.mongodb.net/',
  JWT_SECRET: process.env.JWT_SECRET || 'BugTracker007',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};