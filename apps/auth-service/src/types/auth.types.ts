export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export interface TokenVerificationRequest {
  token: string;
}

export interface TokenVerificationResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  error?: string;
} 