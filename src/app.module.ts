import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module'; // 👈 Agrega esto
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ProductsModule, // ✅ Rutas de productos
    UsersModule, // ✅ Rutas de usuarios
    AuthModule, // ✅ Login / autenticación
    UploadModule, // ✅ Subida de imágenes a Supabase
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
