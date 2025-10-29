import { ValidationPipe } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true
    })
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`Backend running at http://localhost:${port}/api/health`);
}

bootstrap();
