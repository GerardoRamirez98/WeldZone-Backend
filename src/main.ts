import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { CorsOptions, CorsOptionsDelegate } from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const allowedOrigins = [
    'http://localhost:5173',
    'https://weldzone.vercel.app',
    'https://www.weldzone.vercel.app',
  ];

  // ✅ CORS configurado correctamente y sin advertencias ESLint
  const corsOptionsDelegate: CorsOptionsDelegate = (req: unknown, callback) => {
    // Verificamos que req sea un objeto con headers
    let origin: string | undefined;

    if (
      typeof req === 'object' &&
      req !== null &&
      'headers' in req &&
      typeof (req as any).headers === 'object'
    ) {
      origin = (req as any).headers.origin as string | undefined;
    }

    if (!origin || allowedOrigins.includes(origin)) {
      const options: CorsOptions = {
        origin: true,
        credentials: true,
      };
      callback(null, options);
    } else {
      console.warn(`❌ Bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  };

  app.enableCors(corsOptionsDelegate);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}

void bootstrap();
