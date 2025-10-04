import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 habilitar CORS para que el frontend pueda conectarse
  app.enableCors({
    origin: 'http://localhost:5173', // URL de tu frontend
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
