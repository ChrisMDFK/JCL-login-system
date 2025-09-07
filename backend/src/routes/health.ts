import { Router } from 'express';
import { db } from '../database/connection';
import { redis } from '../cache/redis';

const router = Router();

/**
 * 基本健康檢查端點
 */
router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jcl-auth-backend',
    version: '1.0.0'
  });
});

/**
 * 詳細就緒檢查端點
 * 檢查所有依賴服務的狀態
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: { status: 'unknown', message: '', details: {} },
    redis: { status: 'unknown', message: '', details: {} }
  };

  // 檢查資料庫
  try {
    const dbHealth = await db.healthCheck();
    checks.database = dbHealth;
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      message: '資料庫連線失敗',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }

  // 檢查 Redis
  try {
    const redisHealth = await redis.healthCheck();
    checks.redis = redisHealth;
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      message: 'Redis 連線失敗',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }

  // 判斷整體狀態
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks
  });
});

export { router as healthRoutes };