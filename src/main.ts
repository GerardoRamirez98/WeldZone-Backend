import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // ⚙️ Crear la app sin CORS automático
  const app = await NestFactory.create(AppModule, { cors: false });

  // 🌍 Lista blanca de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:5173',
    'https://weldzone.vercel.app',
    'https://www.weldzone.vercel.app',
  ];

  // 🧱 Middleware Express para manejar manualmente el preflight
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin ?? '';

    // 🔓 Permitir si está en la lista o si no hay origen (Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      );
      res.header('Access-Control-Allow-Credentials', 'true');

      // 🟢 Si es preflight (OPTIONS), responder directamente
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    } else {
      console.warn(`🚫 Bloqueado por CORS: ${origin}`);
      return res.status(403).json({ error: 'CORS not allowed' });
    }

    next();
  });

  // ✅ Validaciones automáticas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🚀 Iniciar servidor
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`✅ API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
