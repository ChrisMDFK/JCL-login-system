import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import config from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { validateTenant } from './middleware/tenant-validator';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { tenantRoutes } from './routes/tenants';
import { adminRoutes } from './routes/admin';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { cspReportRoutes } from './routes/csp-report';
import { initializeDatabase } from './database/connection';
import { initializeRedis } from './cache/redis';
import { initializeSentry } from './utils/sentry';

/**
 * JCL 企業級多租戶身分驗證系統
 * 主要應用程式入口點
 * 
 * 功能特色：
 * - 多租戶架構支援
 * - JWT + 刷新令牌機制
 * - 多重驗證（MFA）
 * - 基於角色的存取控制（RBAC）
 * - Redis 會話管理
 * - 稽核日誌與監控
 */
class JCLAuthApplication {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * 初始化中介軟體
   * 設定安全標頭、CORS、壓縮、速率限制等
   */
  private initializeMiddleware(): void {
    // 安全標頭設定
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          connectSrc: ["'self'", "https://api.jcl-system.com", "wss://api.jcl-system.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
        reportOnly: false,
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    }));

    // CORS 設定
    this.app.use(cors({
      origin: config.security.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Tenant-Id',
        'X-Correlation-Id'
      ],
      exposedHeaders: ['X-Correlation-Id', 'X-Rate-Limit-Remaining']
    }));

    // 壓縮回應
    this.app.use(compression());

    // JSON 解析設定
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // 儲存原始請求內容供稽核使用
        (req as any).rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 請求記錄中介軟體
    this.app.use(requestLogger);

    // 全域速率限制
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15分鐘
      max: 1000, // 每個IP每15分鐘最多1000次請求
      message: {
        error: '請求次數過多，請稍後再試',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15分鐘後'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        const tenantId = req.headers['x-tenant-id'] as string;
        const ip = req.ip;
        return tenantId ? `${tenantId}:${ip}` : `global:${ip}`;
      }
    }));

    // 租戶驗證中介軟體
    this.app.use('/api', validateTenant);
  }

  /**
   * 初始化路由
   * 註冊所有 API 端點
   */
  private initializeRoutes(): void {
    // 健康檢查端點（無需驗證）
    this.app.use('/health', healthRoutes);
    this.app.use('/ready', healthRoutes);
    this.app.use('/metrics', metricsRoutes);
    this.app.use('/csp-report', cspReportRoutes);

    // API 路由
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/tenants', tenantRoutes);
    this.app.use('/api/admin', adminRoutes);

    // 404 處理
    this.app.use('*', (req, res) => {
      logger.warn('路由未找到', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(404).json({
        success: false,
        error: '請求的路由不存在',
        code: 'ROUTE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 初始化錯誤處理
   * 設定全域錯誤處理中介軟體
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * 啟動應用程式
   * 初始化資料庫連線、Redis 連線和 Sentry 監控
   */
  public async start(): Promise<void> {
    try {
      // 初始化 Sentry 錯誤監控
      if (config.sentry.dsn) {
        initializeSentry();
        logger.info('Sentry 錯誤監控已初始化');
      }

      // 初始化資料庫連線
      await initializeDatabase();
      logger.info('資料庫連線已建立');

      // 初始化 Redis 連線
      await initializeRedis();
      logger.info('Redis 連線已建立');

      // 啟動伺服器
      const server = this.app.listen(config.port, () => {
        logger.info(`JCL 企業級身分驗證系統已啟動`, {
          port: config.port,
          environment: config.nodeEnv,
          timestamp: new Date().toISOString()
        });
      });

      // 優雅關機處理
      process.on('SIGTERM', () => {
        logger.info('收到 SIGTERM 信號，開始優雅關機程序');
        server.close(() => {
          logger.info('HTTP 伺服器已關閉');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        logger.info('收到 SIGINT 信號，開始優雅關機程序');
        server.close(() => {
          logger.info('HTTP 伺服器已關閉');
          process.exit(0);
        });
      });

    } catch (error) {
      logger.error('應用程式啟動失敗', { error });
      process.exit(1);
    }
  }
}

// 啟動應用程式
const jclAuthApp = new JCLAuthApplication();
jclAuthApp.start().catch((error) => {
  logger.error('應用程式啟動過程中發生未處理的錯誤', { error });
  process.exit(1);
});

export { JCLAuthApplication };
export default jclAuthApp.app;