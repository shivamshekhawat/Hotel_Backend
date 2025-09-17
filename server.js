const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const roomRoutes = require('./src/routes/roomRoutes');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ================== Middleware ==================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// ================== Connect to Database ==================
connectDB()
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  });

// ================== Routes ==================
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ================== Error Handling ==================
app.use(notFoundHandler);
app.use(errorHandler);

// ================== Start Server ==================
app.listen(port, () => {
  logger.info(`✅ Server is running on http://localhost:${port}`);
  logger.info(`📊 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
