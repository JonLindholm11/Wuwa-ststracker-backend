// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database and routes
const { initializeDatabase } = require('./database');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Initialize database
initializeDatabase();

// Routes
app.use('/api', statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Wuthering Waves Stats API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      getStats: 'GET /api/user-stats/:userId/:characterId',
      saveStats: 'POST /api/user-stats',
      deleteStats: 'DELETE /api/user-stats/:userId/:characterId',
      getUserCharacters: 'GET /api/user-stats/:userId'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📱 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
📊 Database: SQLite (wuwa_stats.db)

Available endpoints:
- GET  /api/health
- GET  /api/user-stats/:userId/:characterId  
- POST /api/user-stats
- DELETE /api/user-stats/:userId/:characterId
- GET  /api/user-stats/:userId

Visit http://localhost:${PORT} for API documentation
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

module.exports = app;