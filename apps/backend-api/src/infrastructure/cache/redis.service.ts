import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.connectionPromise = this.initializeConnection();
    await this.connectionPromise;
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.logger.log('🔄 Attempting to connect to Redis...');
      this.logger.debug(`Redis config: ${this.configService.redisHost}:${this.configService.redisPort}`);
      
      const clientOptions: any = {
        socket: {
          host: this.configService.redisHost,
          port: this.configService.redisPort,
          connectTimeout: 5000, // Default timeout
        },
      };

      if (this.configService.redisPassword) {
        clientOptions.password = this.configService.redisPassword;
        this.logger.debug('🔐 Redis password authentication enabled');
      }

      this.client = createClient(clientOptions);

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('✅ Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('⚠️ Disconnected from Redis');
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        this.logger.log('🚀 Redis client ready');
        this.isConnected = true;
      });

      await this.client.connect();
      
      const pong = await this.client.ping();
      this.logger.log(`🏓 Redis ping successful: ${pong}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis:', error.message);
      this.logger.warn('⚠️ Continuing without Redis cache');
      this.isConnected = false;
      this.client = null;
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.connectionPromise) {
      try {
        await this.connectionPromise;
      } catch (error) {
        return false;
      }
    }
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    const isReady = await this.ensureConnection();
    if (!isReady) {
      this.logger.debug(`Redis not available for GET ${key} - connected: ${this.isConnected}, client: ${!!this.client}`);
      return null;
    }
    
    try {
      if (typeof this.client!.get !== 'function') {
        this.logger.error('Redis client.get is not a function');
        return null;
      }
      
      const result = await this.client!.get(key);
      if (result) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error.message);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const isReady = await this.ensureConnection();
    if (!isReady) {
      this.logger.debug(`Redis not available for SET ${key} - connected: ${this.isConnected}, client: ${!!this.client}`);
      return;
    }
    
    try {
      if (typeof this.client!.setEx !== 'function') {
        this.logger.error('Redis client.setEx is not a function');
        return;
      }
      
      const ttl = ttlSeconds || this.configService.redisTtlDefault;
      await this.client!.setEx(key, ttl, value);
      this.logger.debug(`Cache SET for key: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error.message);
    }
  }

  async del(key: string): Promise<void> {
    const isReady = await this.ensureConnection();
    if (!isReady) {
      this.logger.debug(`Redis not available for DEL ${key} - connected: ${this.isConnected}, client: ${!!this.client}`);
      return;
    }
    
    try {
      if (typeof this.client!.del !== 'function') {
        this.logger.error('Redis client.del is not a function');
        return;
      }
      
      await this.client!.del(key);
      this.logger.debug(`Cache DEL for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error.message);
    }
  }

  generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, any>);
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  getConfig() {
    return {
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword,
      ttlDefault: this.configService.redisTtlDefault,
    };
  }

  async closeConnection(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.logger.log('✅ Redis connection closed gracefully');
      } catch (error) {
        this.logger.error('❌ Error closing Redis connection:', error.message);
      }
    }
  }
} 