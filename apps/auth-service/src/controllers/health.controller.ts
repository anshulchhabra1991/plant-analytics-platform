import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }
}