import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Helper function to read secret files
const readSecret = (filename: string): string => {
  try {
    const secretPath = path.join(process.cwd(), '..', 'secrets', filename);
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
    return '';
  } catch (error) {
    console.warn(`Warning: Could not read secret file ${filename}, using environment variable or default`);
    return '';
  }
};

// Get node environment
const nodeEnv = process.env.NODE_ENV || 'development';

// Configuration object
const config = {
  // Basic configuration
  nodeEnv,
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./dev.db',
    password: readSecret('db_password.txt') || process.env.DB_PASSWORD || 'default_password',
    ssl: nodeEnv === 'production',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10)
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: readSecret('redis_password.txt') || process.env.REDIS_PASSWORD || '',
    enabled: process.env.REDIS_ENABLED !== 'false',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'jcl:auth:'
  },

  // JWT configuration
  jwt: {
    secret: readSecret('jwt_secret.txt') || process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Security configuration
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Sentry configuration
  sentry: {
    dsn: readSecret('sentry_dsn.txt') || process.env.SENTRY_DSN || '',
    environment: nodeEnv,
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0')
  },

  // OAuth configuration
  oauth: {
    secret: readSecret('oauth_secret.txt') || process.env.OAUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },

  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: readSecret('smtp_password.txt') || process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@jcl-system.com'
  }
};

export default config;