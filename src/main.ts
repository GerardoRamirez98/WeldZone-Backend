import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { CorsOptionsDelegate, CorsRequest } from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const allowedOrigins = [
    'http://localhost:5173',
    'https://weldzone.vercel.app',
    'https://www.weldzone.vercel.app',
  ];

  // ✅ Configuración CORS sin warnings ni assertions innecesarias
  const corsOptionsDelegate: CorsOptionsDelegate<CorsRequest> = (
    req,
    callback,
  ) => {
    const originHeader = req.headers.origin;

    // Si no hay origin (por ejemplo, Postman), permitir
    if (!originHeader) {
      return callback(null, { origin: true });
    }

    // Aceptar si el origin está en la lista blanca
    if (allowedOrigins.includes(originHeader)) {
      return callback(null, { origin: true, credentials: true });
    }

    // Bloquear orígenes no permitidos
    console.warn(`❌ Bloqueado por CORS: ${originHeader}`);
    return callback(new Error(`CORS not allowed for origin: ${originHeader}`));
  };

  app.enableCors(corsOptionsDelegate);

  // 🧰 Validaciones automáticas globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
