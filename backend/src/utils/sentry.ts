import * as Sentry from '@sentry/node';
import { config } from '../config';

/**
 * Sentry 錯誤監控初始化
 */
export function initializeSentry(): void {
  if (!config.sentry.dsn) {
    console.warn('Sentry DSN 未設定，跳過錯誤監控初始化');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    sampleRate: config.sentry.sampleRate,
    tracesSampleRate: 0.1,
    
    beforeSend(event) {
      // 過濾敏感資訊
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          // 移除密碼等敏感欄位
          const sensitiveFields = ['password', 'token', 'secret', 'key'];
          sensitiveFields.forEach(field => {
            if (data[field]) {
              data[field] = '[Filtered]';
            }
          });
        }
      }
      return event;
    }
  });
}