import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * PostgreSQL 資料庫連線管理器
 * 透過 PgBouncer 連線池進行資料庫存取
 * 
 * 特性：
 * - 連線池管理
 * - 自動重連機制
 * - 健康檢查
 * - 交易模式相容性（關閉預備語句）
 */
class DatabaseManager {
  private pool: Pool | null = null;
  private isInitialized = false;

  /**
   * 初始化資料庫連線池
   * 配置 PgBouncer 相容設定
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.info('資料庫連線已存在，跳過初始化');
        return;
      }

      // 在開發環境中等待資料庫服務啟動
      if (config.nodeEnv === 'development') {
        logger.info('開發環境：等待資料庫服務啟動...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      const connectionString = config.database.url;
      logger.info('嘗試連接資料庫', { url: connectionString.replace(/:[^:@]*@/, ':***@') });

      const connectionString = config.database.url;
      logger.info('嘗試連接資料庫', { url: connectionString.replace(/:[^:@]*@/, ':***@') });

      this.pool = new Pool({
        connectionString,
        // PgBouncer 相容設定
        max: config.database.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: config.database.connectionTimeout,
        // 關閉預備語句以相容 PgBouncer 交易模式
        statement_timeout: 30000,
        query_timeout: 30000,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        // 連線參數設定
        options: '-c search_path=public'
      });

      // 連線事件處理
      this.pool.on('connect', (client) => {
        logger.debug('新的資料庫連線已建立');
        // 設定連線參數
        client.query('SET timezone = "UTC"');
        client.query('SET statement_timeout = 30000');
      });

      this.pool.on('error', (err) => {
        logger.error('資料庫連線錯誤', { error: err.message, stack: err.stack });
      });

      this.pool.on('remove', (client) => {
        logger.debug('資料庫連線已移除');
      });

      // 測試連線
      await this.testConnection();
      
      this.isInitialized = true;
      logger.info('資料庫連線池初始化成功', {
        poolSize: config.database.poolSize,
        ssl: config.database.ssl,
        host: dbUrl.hostname,
        port: dbUrl.port,
        database: dbUrl.pathname.slice(1)
      });

    } catch (error) {
      logger.error('資料庫初始化失敗', { error });
      throw new Error(`資料庫連線初始化失敗: ${error}`);
    }
  }

  /**
   * 測試資料庫連線
   * 執行基本查詢確認連線可用性
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('資料庫連線池尚未初始化');
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();

      logger.info('資料庫連線測試成功', {
        currentTime: result.rows[0]?.current_time,
        version: result.rows[0]?.postgres_version?.split(' ')[0]
      });
    } catch (error) {
      logger.error('資料庫連線測試失敗', { error });
      throw error;
    }
  }

  /**
   * 執行查詢
   * 提供統一的查詢介面，包含錯誤處理和日誌記錄
   */
  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('資料庫連線池尚未初始化');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('資料庫查詢執行', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('資料庫查詢失敗', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 執行交易
   * 提供交易控制，確保資料一致性
   */
  public async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('資料庫連線池尚未初始化');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 健康檢查
   * 檢查資料庫連線狀態
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      if (!this.pool) {
        return {
          status: 'unhealthy',
          message: '資料庫連線池未初始化'
        };
      }

      const start = Date.now();
      const result = await this.pool.query('SELECT 1 as health_check');
      const duration = Date.now() - start;

      if (result.rows[0]?.health_check === 1) {
        return {
          status: 'healthy',
          message: '資料庫連線正常',
          details: {
            responseTime: `${duration}ms`,
            activeConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingRequests: this.pool.waitingCount
          }
        };
      } else {
        return {
          status: 'unhealthy',
          message: '資料庫健康檢查查詢異常'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '資料庫連線失敗',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * 關閉連線池
   * 優雅關機時清理資源
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('資料庫連線池已關閉');
    }
  }

  /**
   * 取得連線池實例
   */
  public getPool(): Pool | null {
    return this.pool;
  }

  /**
   * 取得連線池統計資訊
   */
  public getStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } | null {
    if (!this.pool) return null;

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// 建立全域資料庫管理器實例
export const db = new DatabaseManager();

/**
 * 初始化資料庫連線
 * 應用程式啟動時調用
 */
export async function initializeDatabase(): Promise<void> {
  await db.initialize();
}

/**
 * 關閉資料庫連線
 * 應用程式關閉時調用
 */
export async function closeDatabase(): Promise<void> {
  await db.close();
}

export default db;