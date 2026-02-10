require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const connectDB = require('./config/database');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Server-Driven UI (SDUI) Backend API',
    version: '1.0.0',
    documentation: {
      developers: 'Manage developer accounts',
      apps: 'Manage mobile applications',
      screens: 'Manage screen UI definitions',
      mobileEndpoints: {
        getScreen: 'GET /api/v1/screen - Retrieve full UI JSON for mobile apps',
        getVersion: 'GET /api/v1/screen/version - Check screen version for updates'
      }
    },
    endpoints: {
      api: '/api',
      health: '/api/health'
    }
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 Server running in ${config.nodeEnv} mode`);
  console.log(`🌐 Listening on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📱 Mobile API: http://localhost:${PORT}/api/v1/screen`);
  console.log('===========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
