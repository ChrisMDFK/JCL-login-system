import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 自訂錯誤類別
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 全域錯誤處理中介軟體
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = '內部伺服器錯誤';
  let code = 'INTERNAL_SERVER_ERROR';

  // 處理自訂錯誤
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  }

  // 處理資料庫錯誤
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = '資料重複';
    code = 'DUPLICATE_KEY';
  }

  if (error.message.includes('foreign key')) {
    statusCode = 400;
    message = '資料關聯錯誤';
    code = 'FOREIGN_KEY_ERROR';
  }

  // 處理驗證錯誤
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '資料驗證失敗';
    code = 'VALIDATION_ERROR';
  }

  // 記錄錯誤
  logger.error('請求處理錯誤', {
    error: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    correlationId: req.headers['x-correlation-id']
  });

  // 回應錯誤
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    correlationId: req.headers['x-correlation-id']
  });
}