import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Activa validaciones automáticas de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ❌ elimina campos que no existen en los DTOs
      forbidNonWhitelisted: true, // 🚫 lanza error si mandan campos no permitidos
      transform: true, // 🔄 convierte tipos automáticamente (string → number, etc.)
    }),
  );

  // ✅ CORS configurado para local y producción
  app.enableCors({
    origin: [
      'http://localhost:5173', // Desarrollo local
      'https://weldzone.vercel.app', // Producción
      'https://www.weldzone.vercel.app', // Redirecciones con www
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}
void bootstrap();
