import { Pool } from 'pg';
import Database from 'better-sqlite3';
import config from '../config';
import { logger } from '../utils/logger';

/**
 * PostgreSQL 資料庫連線管理器
 */
class DatabaseManager {
  private pool: Pool | null = null;
  private sqlite: Database.Database | null = null;
  private isInitialized = false;

  /**
   * 初始化資料庫連線池
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
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const connectionString = config.database.url;
      logger.info('嘗試連接資料庫', { 
        url: connectionString.replace(/:[^:@]*@/, ':***@'),
        type: connectionString.startsWith('sqlite:') ? 'SQLite' : 'PostgreSQL'
      });

      if (connectionString.startsWith('sqlite:')) {
        // Use SQLite for local development
        const dbPath = connectionString.replace('sqlite:', '');
        this.sqlite = new Database(dbPath);
        
        // Create basic tables for development
        this.sqlite.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            tenant_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            domain TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        logger.info('SQLite database initialized successfully');
        this.isInitialized = true;
      } else {
        // Use PostgreSQL for production
        this.pool = new Pool({
          connectionString,
          max: config.database.poolSize,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: config.database.connectionTimeout,
          ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
        });

        // Test connection
        try {
          const client = await this.pool.connect();
          await client.query('SELECT 1');
          client.release();
          logger.info('PostgreSQL database initialized successfully');
          this.isInitialized = true;
        } catch (error) {
          logger.warn('PostgreSQL connection failed, falling back to SQLite', { error });
          // Fallback to SQLite
          this.sqlite = new Database('./fallback.db');
          this.sqlite.exec(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              tenant_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          logger.info('Fallback SQLite database initialized');
          this.isInitialized = true;
        }
      }

    } catch (error) {
      logger.error('Database initialization failed', { error });
      // Don't throw error, just log it and continue
      logger.warn('Continuing without database connection');
      this.isInitialized = true;
    }
  }

  /**
   * 執行查詢
   */
  public async query(text: string, params?: any[]): Promise<any> {
    if (this.sqlite) {
      try {
        const stmt = this.sqlite.prepare(text);
        return { rows: stmt.all(params || []) };
      } catch (error) {
        logger.error('SQLite query failed', { error, query: text });
        return { rows: [] };
      }
    }

    if (this.pool) {
      try {
        return await this.pool.query(text, params);
      } catch (error) {
        logger.error('PostgreSQL query failed', { error, query: text });
        return { rows: [] };
      }
    }

    logger.warn('No database connection available');
    return { rows: [] };
  }

  /**
   * 健康檢查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      if (this.sqlite) {
        this.sqlite.prepare('SELECT 1').get();
        return {
          status: 'healthy',
          message: 'SQLite 資料庫連線正常',
          details: { type: 'SQLite' }
        };
      }

      if (this.pool) {
        const result = await this.pool.query('SELECT 1');
        return {
          status: 'healthy',
          message: 'PostgreSQL 資料庫連線正常',
          details: { type: 'PostgreSQL' }
        };
      }

      return {
        status: 'unhealthy',
        message: '無資料庫連線'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '資料庫連線失敗',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * 關閉連線池
   */
  public async close(): Promise<void> {
    if (this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
      logger.info('SQLite database connection closed');
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('PostgreSQL database connection closed');
    }
    this.isInitialized = false;
  }
}

// 建立全域資料庫管理器實例
export const db = new DatabaseManager();

/**
 * 初始化資料庫連線
 */
export async function initializeDatabase(): Promise<void> {
  await db.initialize();
}

/**
 * 關閉資料庫連線
 */
export async function closeDatabase(): Promise<void> {
  await db.close();
}

export default db;