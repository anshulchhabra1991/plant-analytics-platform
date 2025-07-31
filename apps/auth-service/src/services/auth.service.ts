import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, LoginRequest, RegisterRequest, AuthResponse, TokenVerificationResponse, JWTPayload } from '../types/auth.types';
import { DatabaseService } from './database.service';

export class AuthService {
  private jwtSecret: string;
  private databaseService: DatabaseService;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
    this.databaseService = new DatabaseService();
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.databaseService.findUserByEmail(email);
      
      if (!user || !user.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const user = await this.validateUser(loginRequest.email, loginRequest.password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    return this.generateTokens(user);
  }

  async register(registerRequest: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.databaseService.findUserByEmail(registerRequest.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerRequest.password, 12);

    // Create user
    const user = await this.databaseService.createUser({
      email: registerRequest.email,
      password: hashedPassword,
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
    });

    return this.generateTokens(user);
  }

  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      const user = await this.databaseService.findUserById(decoded.sub);
      
      if (!user || !user.isActive) {
        return {
          valid: false,
          error: 'User not found or inactive'
        };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        }
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token'
        };
      } else if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired'
        };
      } else {
        return {
          valid: false,
          error: 'Token verification failed'
        };
      }
    }
  }

  async refreshToken(userId: string): Promise<AuthResponse> {
    const user = await this.databaseService.findUserById(userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    };
  }

  async close(): Promise<void> {
    await this.databaseService.close();
  }
} 