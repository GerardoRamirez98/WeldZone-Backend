import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'reflect-metadata';
import type { CorsOptionsDelegate, CorsRequest } from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // Allowed origins from env (supports wildcard '*')
  const originPatterns = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const patternRegexes = originPatterns.map((pat) => {
    const escaped = pat
      .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  });

  const isAllowedOrigin = (origin: string): boolean => {
    if (!originPatterns.length) return false;
    return (
      originPatterns.includes(origin) || patternRegexes.some((rx) => rx.test(origin))
    );
  };

  // Robust CORS delegate
  const corsOptionsDelegate: CorsOptionsDelegate<CorsRequest> = (req, callback) => {
    const originHeader = req.headers.origin;
    console.log('CORS preflight from:', originHeader);

    if (!originHeader) {
      // Server-to-server or tools (no Origin)
      return callback(null, { origin: true });
    }

    if (isAllowedOrigin(originHeader)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        // allowedHeaders omitted: cors will reflect requested headers automatically
      });
    }

    console.warn(`Blocked by CORS (not allowed): ${originHeader}`);
    return callback(null, { origin: false });
  };

  console.log('CORS allowed origins:', originPatterns);
  app.enableCors(corsOptionsDelegate);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API running at: ${await app.getUrl()}`);
}

void bootstrap();

