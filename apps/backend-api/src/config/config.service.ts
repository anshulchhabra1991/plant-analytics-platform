import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get databaseHost(): string {
    return process.env.POSTGRES_HOST || 'postgres';
  }

  get databasePort(): number {
    return parseInt(process.env.POSTGRES_PORT || '5432', 10);
  }

  get databaseUsername(): string {
    return process.env.POSTGRES_USER || 'plantuser';
  }

  get databasePassword(): string {
    return process.env.POSTGRES_PASSWORD || 'plantpassword123';
  }

  get databaseName(): string {
    return process.env.POSTGRES_DB || 'plant_analytics';
  }

  get databaseSynchronize(): boolean {
    return false;
  }

  get databaseLogging(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || 'redis';
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || '6379', 10);
  }

  get redisPassword(): string | undefined {
    return process.env.REDIS_PASSWORD || undefined;
  }

  get redisTtlDefault(): number {
    return parseInt(process.env.REDIS_TTL_DEFAULT || '3600', 10); // 1 hour default
  }

  get appPort(): number {
    return parseInt(process.env.BACKEND_PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || '*';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'change-me-in-production';
  }

  get encryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'change-me-32-chars-long-please!';
  }
  get rateLimitWindowMs(): number {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000', 10);
  }

  get rateLimitMaxRequests(): number {
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10);
  }

  get enableSwagger(): boolean {
    return process.env.ENABLE_SWAGGER === 'true';
  }

  get minioEndpoint(): string {
    return process.env.MINIO_ENDPOINT || 'minio';
  }

  get minioPort(): number {
    return parseInt(process.env.MINIO_PORT || '9000', 10);
  }

  get minioAccessKey(): string {
    return process.env.MINIO_ROOT_USER || 'egriduser';
  }

  get minioSecretKey(): string {
    return process.env.MINIO_ROOT_PASSWORD || 'egridpass123';
  }

  get minioBucket(): string {
    return process.env.MINIO_BUCKET || 'egrid-data';
  }

  get rabbitmqHost(): string {
    return process.env.RABBITMQ_HOST || 'rabbitmq';
  }

  get rabbitmqPort(): number {
    return parseInt(process.env.RABBITMQ_PORT || '5672', 10);
  }

  get rabbitmqUsername(): string {
    return process.env.RABBITMQ_USER || 'egriduser';
  }

  get rabbitmqPassword(): string {
    return process.env.RABBITMQ_PASSWORD || 'egridpass123';
  }

  get rabbitmqVhost(): string {
    return process.env.RABBITMQ_VHOST || '/';
  }

  get<T = string>(key: string, defaultValue?: T): T {
    const value = process.env[key];
    if (value === undefined) {
      return defaultValue as T;
    }
    return value as unknown as T;
  }
} 