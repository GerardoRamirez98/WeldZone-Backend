import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

// Configuración segura del JWT: requiere JWT_SECRET definido
const jwtSecret =
  process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test_secret' : undefined);
if (!jwtSecret) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno.');
}

const jwtConfig: JwtModuleOptions = {
  secret: jwtSecret,
  signOptions: { expiresIn: '1h' },
};

@Module({
  imports: [UsersModule, JwtModule.register(jwtConfig)],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
