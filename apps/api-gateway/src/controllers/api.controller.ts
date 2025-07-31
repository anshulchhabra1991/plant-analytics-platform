import { Controller, All, Req, Res, UseGuards, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from '../services/proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

interface User {
  id: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

@Controller()
export class ApiController {
  private readonly backendUrl = process.env.BACKEND_URL || 'http://backend-api:3000';

  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  getRoot() {
    return {
      name: process.env.APP_NAME || 'Plant Analytics API Gateway',
      version: process.env.APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      message: 'Plant Analytics API Gateway',
      endpoints: {
        auth: '/auth (proxy to Auth-Service)',
        api: '/api (protected)',
        public: '/public (optional auth)',
        health: '/health',
      },
    };
  }

  @All('api/*')
  @UseGuards(JwtAuthGuard)
  async proxyToBackend(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api', '');
      const url = `${this.backendUrl}${path}`;
      
      const headers = {
        ...req.headers,
        'x-gateway-source': 'plant-analytics-gateway',
        'x-user-id': req.user?.id,
        'x-user-email': req.user?.email,
      };

      const result = await this.proxyService.proxyRequest(
        req.method,
        url,
        req.body,
        headers,
      );

      res.json(result);
    } catch (error) {
      console.error('API proxy error:', error);
      const status = (error as any)?.status || 502;
      const response = (error as any)?.response || { error: 'Backend service unavailable' };
      res.status(status).json(response);
    }
  }

  @All('public/*')
  @UseGuards(OptionalJwtAuthGuard)
  async proxyToPublic(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/public', '');
      const url = `${this.backendUrl}${path}`;
      
      const headers = {
        ...req.headers,
        'x-gateway-source': 'plant-analytics-gateway',
        ...(req.user && {
          'x-user-id': req.user.id,
          'x-user-email': req.user.email,
        }),
      };

      const result = await this.proxyService.proxyRequest(
        req.method,
        url,
        req.body,
        headers,
      );

      res.json(result);
    } catch (error) {
      console.error('Public proxy error:', error);
      const status = (error as any)?.status || 502;
      const response = (error as any)?.response || { error: 'Backend service unavailable' };
      res.status(status).json(response);
    }
  }

  @All('metrics')
  async proxyToMetrics(@Req() req: Request, @Res() res: Response) {
    try {
      const url = `${this.backendUrl}/metrics`;
      
      const headers = {
        ...req.headers,
        'x-gateway-source': 'plant-analytics-gateway',
      };

      const result = await this.proxyService.proxyRequest(
        req.method,
        url,
        req.body,
        headers,
      );

      res.json(result);
    } catch (error) {
      console.error('Metrics proxy error:', error);
      const status = (error as any)?.status || 502;
      const response = (error as any)?.response || { error: 'Backend metrics unavailable' };
      res.status(status).json(response);
    }
  }
}