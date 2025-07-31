import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProxyService } from '../services/proxy.service';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for auth
export class AuthController {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5000';

  constructor(private readonly proxyService: ProxyService) {}

  @Post('login')
  async login(@Body() loginData: any) {
    try {
      return await this.proxyService.proxyRequest('POST', `${this.authServiceUrl}/auth/login`, loginData);
    } catch (error) {
      console.error('Login proxy error:', error);
      const data = (error as any)?.response?.data || { error: 'Login failed' };
      const status = (error as any)?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(data, status);
    }
  }

  @Post('register')
  async register(@Body() registerData: any) {
    try {
      return await this.proxyService.proxyRequest('POST', `${this.authServiceUrl}/auth/register`, registerData);
    } catch (error) {
      console.error('Register proxy error:', error);
      const data = (error as any)?.response?.data || { error: 'Registration failed' };
      const status = (error as any)?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(data, status);
    }
  }

  @Post('verify')
  async verify(@Body() verifyData: any) {
    try {
      return await this.proxyService.proxyRequest('POST', `${this.authServiceUrl}/auth/verify`, verifyData);
    } catch (error) {
      console.error('Token verification proxy error:', error);
      const data = (error as any)?.response?.data || { error: 'Token verification failed' };
      const status = (error as any)?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(data, status);
    }
  }

  @Get('health')
  async health() {
    try {
      return await this.proxyService.proxyRequest('GET', `${this.authServiceUrl}/auth/health`);
    } catch (error) {
      console.error('Health check proxy error:', error);
      throw new HttpException({ error: 'Auth service unavailable' }, HttpStatus.BAD_GATEWAY);
    }
  }
}