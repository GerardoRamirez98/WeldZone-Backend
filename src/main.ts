import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌍 Lista blanca de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:5173',
    'https://weldzone.vercel.app',
    'https://www.weldzone.vercel.app',
  ];

  // ✅ Configuración CORS tipada correctamente (sin rojos)
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // Si no hay "origin" (por ejemplo, Postman), permitir
      if (!origin) {
        callback(null, true);
        return;
      }

      // Si el origen está permitido, permitir
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Si el origen NO está permitido, bloquear
      console.warn(`🚫 Bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Validaciones automáticas de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🚀 Arranca el servidor
  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
