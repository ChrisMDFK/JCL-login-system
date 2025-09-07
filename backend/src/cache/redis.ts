import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Redis 快取管理器
 * 提供會話儲存和快取功能
 */
class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected = false;

  /**
   * 初始化 Redis 連線
   */
  public async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: config.redis.url,
        password: config.redis.password,
        database: config.redis.db,
        socket: {
          connectTimeout: 10000,
          lazyConnect: true
        }
      });

      // 事件監聽
      this.client.on('connect', () => {
        logger.info('Redis 連線已建立');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis 連線就緒');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis 連線錯誤', { error: error.message });
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis 連線已關閉');
      });

      // 建立連線
      await this.client.connect();
      
      // 測試連線
      await this.client.ping();
      
      logger.info('Redis 初始化成功');
    } catch (error) {
      logger.error('Redis 初始化失敗', { error });
      throw new Error(`Redis 連線失敗: ${error}`);
    }
  }

  /**
   * 設定快取值
   */
  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis 連線未建立');
    }

    const fullKey = `${config.redis.keyPrefix}${key}`;
    
    if (ttl) {
      await this.client.setEx(fullKey, ttl, value);
    } else {
      await this.client.set(fullKey, value);
    }
  }

  /**
   * 取得快取值
   */
  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis 連線未建立');
    }

    const fullKey = `${config.redis.keyPrefix}${key}`;
    return await this.client.get(fullKey);
  }

  /**
   * 刪除快取值
   */
  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis 連線未建立');
    }

    const fullKey = `${config.redis.keyPrefix}${key}`;
    await this.client.del(fullKey);
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
      if (!this.client || !this.isConnected) {
        return {
          status: 'unhealthy',
          message: 'Redis 連線未建立'
        };
      }

      const start = Date.now();
      await this.client.ping();
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        message: 'Redis 連線正常',
        details: {
          responseTime: `${duration}ms`,
          connected: this.isConnected
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis 健康檢查失敗',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * 關閉連線
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis 連線已關閉');
    }
  }

  /**
   * 取得客戶端實例
   */
  public getClient(): RedisClientType | null {
    return this.client;
  }
}

// 建立全域 Redis 管理器實例
export const redis = new RedisManager();

/**
 * 初始化 Redis 連線
 */
export async function initializeRedis(): Promise<void> {
  await redis.initialize();
}

/**
 * 關閉 Redis 連線
 */
export async function closeRedis(): Promise<void> {
  await redis.close();
}

export default redis;