import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const verification = await this.authService.verifyToken(token);
      
      if (!verification.valid) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = verification.user;
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}