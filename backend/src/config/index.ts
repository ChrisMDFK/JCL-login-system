import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

/**
 * 讀取 Docker Secret 檔案
 * 支援從檔案讀取敏感資料，提高安全性
 */
function readSecretFile(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8').trim();
    }
    return '';
  } catch (error) {
    console.error(`無法讀取 Secret 檔案: ${filePath}`, error);
    return '';
  }
}

/**
 * 應用程式配置
 * 集中管理所有環境變數和設定參數
 */
export const config = {
  // 基本設定
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  // JWT 相關設定
  jwt: {
    secret: process.env.JWT_SECRET_FILE 
      ? readSecretFile(process.env.JWT_SECRET_FILE)
      : process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'jcl-auth-system',
    audience: process.env.JWT_AUDIENCE || 'jcl-enterprise'
  },

  // 資料庫設定
  database: {
    url: process.env.DATABASE_URL || 'postgresql://jcl_user:jcl_secure_password_2024@localhost:6432/jcl_auth',
    password: process.env.DATABASE_PASSWORD_FILE
      ? readSecretFile(process.env.DATABASE_PASSWORD_FILE)
      : process.env.DATABASE_PASSWORD || 'jcl_secure_password_2024',
    ssl: process.env.DATABASE_SSL === 'true',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '25', 10),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10)
  },

  // Redis 設定
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD_FILE
      ? readSecretFile(process.env.REDIS_PASSWORD_FILE)
      : process.env.REDIS_PASSWORD || 'jcl_redis_password_2024',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'jcl-auth:',
    sessionTTL: parseInt(process.env.REDIS_SESSION_TTL || '3600', 10), // 1小時
    refreshTokenTTL: parseInt(process.env.REDIS_REFRESH_TOKEN_TTL || '604800', 10) // 7天
  },

  // CORS 設定
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://jcl-system.com', 'https://admin.jcl-system.com', 'https://app.jcl-system.com'],

  // 電子郵件設定
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD_FILE
      ? readSecretFile(process.env.SMTP_PASSWORD_FILE)
      : process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'no-reply@jcl-system.com'
  },

  // OAuth 設定
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_CLIENT_SECRET_FILE
        ? readSecretFile(process.env.OAUTH_CLIENT_SECRET_FILE)
        : process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://api.jcl-system.com/api/auth/oauth/google/callback'
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_CLIENT_SECRET_FILE
        ? readSecretFile(process.env.OAUTH_CLIENT_SECRET_FILE)
        : process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'https://api.jcl-system.com/api/auth/oauth/microsoft/callback'
    }
  },

  // MFA 設定
  mfa: {
    issuer: process.env.MFA_ISSUER || 'JCL Enterprise Auth',
    otpWindow: parseInt(process.env.MFA_OTP_WINDOW || '2', 10),
    emailOtpLength: parseInt(process.env.MFA_EMAIL_OTP_LENGTH || '6', 10),
    emailOtpTTL: parseInt(process.env.MFA_EMAIL_OTP_TTL || '300', 10), // 5分鐘
    maxFailedAttempts: parseInt(process.env.MFA_MAX_FAILED_ATTEMPTS || '5', 10)
  },

  // 安全設定
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    argon2: {
      timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
      parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10)
    },
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900', 10), // 15分鐘
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here!' // AES-256需要32位元組
  },

  // 速率限制設定
  rateLimiting: {
    loginWindow: parseInt(process.env.LOGIN_RATE_WINDOW || '900', 10), // 15分鐘
    loginMaxRequests: parseInt(process.env.LOGIN_RATE_MAX || '5', 10),
    apiWindow: parseInt(process.env.API_RATE_WINDOW || '900', 10), // 15分鐘
    apiMaxRequests: parseInt(process.env.API_RATE_MAX || '1000', 10),
    uploadWindow: parseInt(process.env.UPLOAD_RATE_WINDOW || '3600', 10), // 1小時
    uploadMaxRequests: parseInt(process.env.UPLOAD_RATE_MAX || '10', 10)
  },

  // 檔案上傳設定
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: (process.env.UPLOAD_ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // Sentry 錯誤監控設定
  sentry: {
    dsn: process.env.SENTRY_DSN_FILE
      ? readSecretFile(process.env.SENTRY_DSN_FILE)
      : process.env.SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0')
  },

  // 記錄設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },

  // 稽核設定
  audit: {
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555', 10), // 7年
    batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '1000', 10),
    enableHashChain: process.env.AUDIT_ENABLE_HASH_CHAIN !== 'false'
  },

  // WebAuthn 設定
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'JCL 企業身分驗證系統',
    rpId: process.env.WEBAUTHN_RP_ID || 'jcl-system.com',
    origin: process.env.WEBAUTHN_ORIGIN || 'https://jcl-system.com',
    timeout: parseInt(process.env.WEBAUTHN_TIMEOUT || '60000', 10) // 60秒
  }
};

/**
 * 驗證必要的配置參數
 * 確保所有關鍵設定都已正確配置
 */
export function validateConfig(): void {
  const required = [
    'jwt.secret',
    'database.url'
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`缺少必要的配置參數: ${missing.join(', ')}`);
  }

  // 警告預設值使用
  if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️  警告: 正在使用預設的 JWT 密鑰，生產環境中請務必更換！');
  }

  if (config.security.sessionSecret === 'your-session-secret-change-in-production') {
    console.warn('⚠️  警告: 正在使用預設的會話密鑰，生產環境中請務必更換！');
  }
}

// 啟動時驗證配置
validateConfig();