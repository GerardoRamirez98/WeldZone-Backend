import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import type { Request, Response, NextFunction } from 'express'; // 👈 agrega esto arriba

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌍 Lista blanca de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:5173', // Local
    'https://weldzone.vercel.app', // Producción principal
    'https://www.weldzone.vercel.app', // Con www
  ];

  // ✅ Configuración robusta de CORS (funciona en Railway)
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true); // Permitir Postman
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn(`🚫 Bloqueado por CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ✅ Middleware para manejar manualmente solicitudes OPTIONS (preflight)
  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin || '*';
      res.header('Access-Control-Allow-Origin', origin);
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      );
      res.sendStatus(204);
      return;
    }
    next();
  });

  // ✅ Validaciones automáticas de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🚀 Inicia servidor
  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
