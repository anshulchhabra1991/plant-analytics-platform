import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PowerPlantsModule } from './modules/power-plants/power-plants.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule as RedisCacheModule } from './infrastructure/cache/cache.module';
import { ConfigModule } from './config/config.module';
import { HealthController } from './modules/health/health.controller';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { MetricsController } from './modules/metrics/metrics.controller';
import { GatewayGuard } from './guards/gateway.guard';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisCacheModule,
    PowerPlantsModule,
    AnalyticsModule,
    IngestionModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: GatewayGuard,
    },
  ],
})

export class AppModule { }
