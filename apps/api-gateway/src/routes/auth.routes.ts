import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5000';

// Login endpoint - proxy to Auth-Service
router.post('/login', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${authServiceUrl}/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Login proxy error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Login failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Register endpoint - proxy to Auth-Service
router.post('/register', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${authServiceUrl}/auth/register`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Register proxy error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Registration failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Verify token endpoint - proxy to Auth-Service
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${authServiceUrl}/auth/verify`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Token verification proxy error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Token verification failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Refresh token endpoint - proxy to Auth-Service
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${authServiceUrl}/auth/refresh`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Refresh token proxy error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Token refresh failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check - proxy to Auth-Service
router.get('/health', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${authServiceUrl}/auth/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Health check proxy error:', error);
    res.status(502).json({ error: 'Auth service unavailable' });
  }
});

export default router; 