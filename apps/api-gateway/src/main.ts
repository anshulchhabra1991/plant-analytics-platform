import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
    credentials: true,
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);
  
  console.log('🚪 API Gateway running on port', port);
  console.log('🎯 Environment:', process.env.NODE_ENV || 'development');
  console.log('📝 Endpoints:');
  console.log('   - Health: http://localhost:8000/health');
  console.log('   - Auth proxy: http://localhost:8000/auth/*');
  console.log('   - API proxy: http://localhost:8000/api/*');
  console.log('✅ API Gateway initialized successfully');
}

bootstrap().catch((error) => {
  console.error('❌ API Gateway startup failed:', error);
  process.exit(1);
});