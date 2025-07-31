import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  email: string;
}

export interface TokenVerificationResponse {
  valid: boolean;
  user?: User;
  error?: string;
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5000';

  constructor(private readonly httpService: HttpService) {}

  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/verify`, { token })
      );
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', (error as any)?.message || 'Unknown error');
      return { valid: false, error: 'Token verification failed' };
    }
  }
}