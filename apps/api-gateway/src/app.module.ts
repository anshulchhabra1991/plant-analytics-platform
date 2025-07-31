import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './controllers/health.controller';
import { AuthController } from './controllers/auth.controller';
import { ApiController } from './controllers/api.controller';
import { AuthService } from './services/auth.service';
import { ProxyService } from './services/proxy.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Module({
  imports: [
    HttpModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [HealthController, AuthController, ApiController],
  providers: [
    AuthService, 
    ProxyService, 
    JwtAuthGuard, 
    OptionalJwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}