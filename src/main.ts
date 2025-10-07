import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS configurado para local y producción
  app.enableCors({
    origin: [
      'http://localhost:5173', // Desarrollo local
      'https://weldzone.vercel.app', // Producción
      'https://www.weldzone.vercel.app', // Previene errores por redirecciones
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API corriendo en: ${await app.getUrl()}`);
}
void bootstrap();
