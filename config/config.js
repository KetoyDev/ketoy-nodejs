require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sdui_backend'
  },
  
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'sdui-json-files',
    endpoint: process.env.R2_ENDPOINT
  },
  
  security: {
    apiSecret: process.env.API_SECRET || 'default-secret-change-in-production',
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};
