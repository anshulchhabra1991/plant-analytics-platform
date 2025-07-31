import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

// Feature Modules
import { PowerPlantsModule } from './modules/power-plants/power-plants.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule as RedisCacheModule } from './infrastructure/cache/cache.module';
import { ConfigModule } from './config/config.module';
import { HealthController } from './modules/health/health.controller'; // update the path as needed

// Shared
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { MetricsController } from './modules/metrics/metrics.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Database
    DatabaseModule,

    // Cache
    RedisCacheModule,

    // Feature Modules
    PowerPlantsModule,
    AnalyticsModule,
    IngestionModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})

@Module({
  imports: [],
  controllers: [HealthController, MetricsController],
  providers: [],
})

export class AppModule { }
