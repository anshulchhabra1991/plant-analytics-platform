import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequest, RegisterRequest, TokenVerificationRequest } from '../types/auth.types';

const router = Router();
const authService = new AuthService();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body as RegisterRequest;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, password, firstName, and lastName are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    const result = await authService.register({ 
      email, 
      password, 
      firstName, 
      lastName 
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Verify token endpoint
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as TokenVerificationRequest;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    const result = await authService.verifyToken(token);
    res.json(result);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token is required' 
      });
    }

    // Verify the refresh token to get user ID
    const verification = await authService.verifyToken(refreshToken);
    
    if (!verification.valid || !verification.user) {
      return res.status(401).json({ 
        error: 'Invalid refresh token' 
      });
    }

    const result = await authService.refreshToken(verification.user.id);
    res.json(result);
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router; 