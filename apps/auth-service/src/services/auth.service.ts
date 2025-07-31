import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User, LoginRequest, RegisterRequest, AuthResponse, TokenVerificationResponse, JWTPayload } from '../types/auth.types';
import { DatabaseService } from './database.service';

@Injectable()
export class AuthService {
  private jwtSecret: string;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
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
    const existingUser = await this.databaseService.findUserByEmail(registerRequest.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerRequest.password, 12);

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



  private generateTokens(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h',  // Extended to 1 hour since no refresh token
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async close(): Promise<void> {
    await this.databaseService.close();
  }
} 