// server.js - Entry point untuk menjalankan server
require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`📄 API Docs: http://localhost:${PORT}/`);
      console.log(`\n🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});