import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class GatewayGuard implements CanActivate {
  private readonly logger = new Logger(GatewayGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip in development mode for easier testing
    if (this.configService.isDevelopment) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Check if request is coming from the API Gateway
    const gatewayHeader = request.headers['x-gateway-source'];
    
    // Log the request details for debugging
    this.logger.debug(`Request from: ${request.ip}, gateway header: ${gatewayHeader}`);

    // In production, only allow requests from API Gateway container
    if (!gatewayHeader || gatewayHeader !== 'plant-analytics-gateway') {
      this.logger.warn(`Unauthorized direct access attempt from ${request.ip}`);
      throw new ForbiddenException('Direct access to backend API is not allowed. Please use the API Gateway.');
    }

    return true;
  }
} 