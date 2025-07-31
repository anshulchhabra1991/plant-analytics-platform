import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, continue without user
      return true;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return true;
    }

    try {
      const verification = await this.authService.verifyToken(token);
      
      if (verification.valid) {
        request.user = verification.user;
      }
    } catch (error) {
      // On error, continue without user (optional auth)
      console.warn('Optional auth failed:', (error as any)?.message || 'Unknown error');
    }

    return true;
  }
}