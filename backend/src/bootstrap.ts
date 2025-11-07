import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

export async function createApp(): Promise<import('express').Application> {
  const app = express();
  const adapter = new ExpressAdapter(app);
  const nest = await NestFactory.create(AppModule, adapter);

  nest.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  nest.setGlobalPrefix('api');

  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  nest.enableCors({
    origin: origins.length ? origins : true,
    credentials: true
  });

  await nest.init();

  return app;
}
