import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5000; // Always use internal port 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Auth Service',
    version: '1.0.0',
    endpoints: {
      health: '/auth/health',
      login: '/auth/login',
      register: '/auth/register',
      verify: '/auth/verify',
      refresh: '/auth/refresh',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Auth Service error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/auth/health`);
  console.log(`   - Login: http://localhost:${PORT}/auth/login`);
  console.log(`   - Register: http://localhost:${PORT}/auth/register`);
  console.log(`   - Verify: http://localhost:${PORT}/auth/verify`);
  console.log(`   - Refresh: http://localhost:${PORT}/auth/refresh`);
}); 