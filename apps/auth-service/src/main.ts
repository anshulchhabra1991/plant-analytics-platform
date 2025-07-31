import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  console.log('🔐 Auth Service running on port', port);
  console.log('🎯 Environment:', process.env.NODE_ENV || 'development');
  console.log('📝 Endpoints:');
  console.log('   - Health: http://localhost:5000/auth/health');
  console.log('   - Login: http://localhost:5000/auth/login');
  console.log('   - Register: http://localhost:5000/auth/register');
  console.log('   - Verify: http://localhost:5000/auth/verify');
  console.log('✅ Auth service initialized successfully');
}

bootstrap().catch((error) => {
  console.error('❌ Auth Service startup failed:', error);
  process.exit(1);
});