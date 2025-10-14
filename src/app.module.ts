import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from './config/config.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ProductsModule, // ✅ Rutas de productos
    UsersModule, // ✅ Rutas de usuarios
    AuthModule, // ✅ Login / autenticación
    UploadModule, // ✅ Subida de imágenes a Supabase
    ConfigModule, // ✅ Configuración (número de WhatsApp)
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
