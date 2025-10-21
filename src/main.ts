import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { CorsOptionsDelegate, CorsRequest } from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // 🧩 Orígenes permitidos (desde .env)
  const allowedOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  // ✅ Configuración CORS robusta y segura
  const corsOptionsDelegate: CorsOptionsDelegate<CorsRequest> = (
    req,
    callback,
  ) => {
    const originHeader = req.headers.origin;

    // 🔍 Log para saber quién está accediendo
    console.log('🔍 Solicitud desde:', originHeader);

    // Permitir solicitudes sin origin (Postman, server-side, etc.)
    if (!originHeader) {
      return callback(null, { origin: true });
    }

    // Si el origin está permitido
    if (allowedOrigins.includes(originHeader)) {
      return callback(null, {
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
    }

    // 🚫 Si el origin no está permitido, lo bloqueamos pero sin romper el servidor
    console.warn(
      `🚫 Bloqueado por CORS (origen no permitido): ${originHeader}`,
    );
    return callback(null, { origin: false });
  };

  // 🔧 Activar CORS con configuración personalizada
  console.log('🌍 CORS orígenes permitidos:', allowedOrigins);
  app.enableCors(corsOptionsDelegate);

  // 🧰 Validaciones globales (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🚀 Iniciar servidor
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
