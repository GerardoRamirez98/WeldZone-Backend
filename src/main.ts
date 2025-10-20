import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { CorsOptionsDelegate, CorsRequest } from 'cors';

async function bootstrap() {
  // ✅ Quitamos cors:false
  const app = await NestFactory.create(AppModule);

  // 🧩 Orígenes permitidos (dinámico desde .env)
  const allowedOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  // ✅ Configuración CORS robusta
  const corsOptionsDelegate: CorsOptionsDelegate<CorsRequest> = (
    req,
    callback,
  ) => {
    const originHeader = req.headers.origin;

    // Permitir solicitudes sin origin (ej: Postman, server-side)
    if (!originHeader) {
      return callback(null, { origin: true });
    }

    // Si el origin está permitido, lo aceptamos
    if (allowedOrigins.includes(originHeader)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
    }

    // Si el origin no está permitido, lo bloqueamos
    console.warn(`🚫 Bloqueado por CORS: ${originHeader}`);
    return callback(new Error(`CORS not allowed for origin: ${originHeader}`), {
      origin: false,
    });
  };

  // 🔧 Activamos CORS con configuración personalizada
  app.enableCors(corsOptionsDelegate);

  // 🧰 Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🚀 Iniciamos servidor
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
// Redeploy trigger
