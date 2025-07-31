import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

export class AuthMiddleware {
  private authServiceUrl: string;

  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5000';
  }

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json({ error: 'Token required' });
        return;
      }

      // Call Auth-Service to verify token
      const response = await axios.post(`${this.authServiceUrl}/auth/verify`, {
        token: token
      });

      if (!response.data.valid) {
        res.status(401).json({ error: response.data.error || 'Invalid token' });
        return;
      }

      req.user = response.data.user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          res.status(401).json({ error: 'Invalid token' });
        } else {
          res.status(502).json({ error: 'Auth service unavailable' });
        }
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  };

  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
      
      if (!hasRequiredRole) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        next();
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        next();
        return;
      }

      // Call Auth-Service to verify token
      const response = await axios.post(`${this.authServiceUrl}/auth/verify`, {
        token: token
      });

      if (response.data.valid) {
        req.user = response.data.user;
      }

      next();
    } catch (error) {
      // For optional auth, we just continue without setting user
      next();
    }
  };
} 