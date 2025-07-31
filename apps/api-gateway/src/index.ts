import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
// import { config } from '@plant-analytics/config';

// Temporary config for gateway
const config = {
  app: {
    port: parseInt(process.env.GATEWAY_PORT || '8000', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    name: process.env.APP_NAME || 'Plant Analytics Gateway',
    version: process.env.APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  api: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  gateway: {
    port: parseInt(process.env.GATEWAY_PORT || '8000', 10),
    host: process.env.GATEWAY_HOST || '0.0.0.0',
  }
};

const app = express();
const authMiddleware = new AuthMiddleware();

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || '*');
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.api.rateLimitWindowMs,
  max: config.api.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.app.environment,
  });
});

// Authentication routes - proxy to Auth-Service
app.use('/auth', authRoutes);

// Protected API routes - require authentication
app.use('/api', authMiddleware.authenticate, createProxyMiddleware({
  target: 'http://backend-api:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix when forwarding
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Backend service unavailable' });
  },
}));

// Public API routes - optional authentication
app.use('/public', authMiddleware.optionalAuth, createProxyMiddleware({
  target: 'http://backend-api:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/public': '', // Remove /public prefix when forwarding
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Backend service unavailable' });
  },
}));

// Legacy redirects
app.use('/api/plants/*', (req, res, next) => {
  const newPath = req.path.replace('/api/plants', '/api/power-plants');
  res.redirect(301, newPath);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    environment: config.app.environment,
    message: 'Plant Analytics API Gateway',
    endpoints: {
      auth: '/auth (proxy to Auth-Service)',
      api: '/api (protected)',
      public: '/public (optional auth)',
      health: '/health',
    },
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

app.use('/metrics', createProxyMiddleware({
  target: 'http://backend-api:3000',
  changeOrigin: true,
  pathRewrite: { '^/metrics': '/metrics' },
  onError: (err, req, res) => {
    console.error('Proxy error for /metrics:', err);
    res.status(502).json({ error: 'Backend metrics unavailable' });
  },
}));

// Start server
const PORT = config.gateway.port;
const HOST = config.gateway.host;

app.listen(PORT, HOST, () => {
  console.log(`✅ API Gateway running on http://${HOST}:${PORT}`);
  console.log(`🎯 Environment: ${config.app.environment}`);
  console.log(`🔗 Backend URL: http://backend-api:${config.app.port}`);
  console.log(`🔐 Auth Service URL: ${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}`);
  console.log(`⚡ Rate limit: ${config.api.rateLimitMaxRequests} requests per ${config.api.rateLimitWindowMs}ms`);
  console.log(`🔐 Authentication enabled with dedicated Auth-Service`);
  console.log(`📝 Auth endpoints: /auth/login, /auth/register, /auth/verify, /auth/refresh`);
}); 