import fs from 'fs';
import path from 'path';

// Helper function to read secret files
const readSecret = (filename: string): string => {
  try {
    const secretPath = path.join(process.cwd(), '..', 'secrets', filename);
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    console.warn(`Warning: Could not read secret file ${filename}, using environment variable or default`);
    return '';
  }
};

// Configuration object
const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./dev.db',
    password: readSecret('db_password.txt') || process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production'
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: readSecret('redis_password.txt') || process.env.REDIS_PASSWORD || '',
    enabled: process.env.REDIS_ENABLED !== 'false'
  },

  // JWT configuration
  jwt: {
    secret: readSecret('jwt_secret.txt') || process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
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
  },

  // Sentry configuration
  sentry: {
    dsn: readSecret('sentry_dsn.txt') || process.env.SENTRY_DSN || '',
    enabled: process.env.SENTRY_ENABLED === 'true'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      path: process.env.LOG_FILE_PATH || './logs',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10)
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_COLORIZE !== 'false'
    }
  },

  // Security configuration
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },

  // Feature flags
  features: {
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    multiTenant: process.env.FEATURE_MULTI_TENANT === 'true',
    oauth: process.env.FEATURE_OAUTH === 'true'
  }
};

export default config;