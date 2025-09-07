import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { logger } from '../utils/logger';

/**
 * 租戶驗證中介軟體
 * 驗證請求中的租戶 ID 是否有效
 */
export async function validateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // 對於某些端點不需要租戶驗證
    const skipTenantValidation = [
      '/health',
      '/ready',
      '/metrics',
      '/csp-report',
      '/api/auth/login',
      '/api/auth/register',
    ];

    if (skipTenantValidation.some(path => req.path.startsWith(path))) {
      return next();
    }

    // 開發環境下可以跳過租戶驗證或使用環境變數設定
    if ((process.env.NODE_ENV === 'development' || process.env.SKIP_TENANT_VALIDATION === 'true') && !tenantId) {
      logger.warn('開發環境：跳過租戶驗證', {
        path: req.path,
        method: req.method
      });
      return next();
    }

    if (!tenantId) {
      throw new AppError('缺少租戶 ID', 400, 'MISSING_TENANT_ID');
    }

    // 這裡可以加入租戶存在性驗證
    // const tenant = await getTenantById(tenantId);
    // if (!tenant) {
    //   throw new AppError('租戶不存在', 404, 'TENANT_NOT_FOUND');
    // }

    next();
  } catch (error) {
    next(error);
  }
}