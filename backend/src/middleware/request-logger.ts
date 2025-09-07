import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 請求記錄中介軟體
 * 記錄所有 HTTP 請求的詳細資訊
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  // 設定關聯 ID
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  // 記錄請求開始
  logger.info('請求開始', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId,
    tenantId: req.headers['x-tenant-id'],
    contentLength: req.get('Content-Length')
  });

  // 監聽回應完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('請求完成', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId,
      contentLength: res.get('Content-Length')
    });
  });

  next();
}