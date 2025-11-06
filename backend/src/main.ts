import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins && allowedOrigins.length ? allowedOrigins : true,
    credentials: true
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log('Backend running at http://localhost:' + port + '/api/health');
}

bootstrap();
