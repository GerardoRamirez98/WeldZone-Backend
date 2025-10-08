import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

interface RequestWithUser extends Request {
  user?: { role: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 🔍 Leemos los roles requeridos de los metadatos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ✅ Si la ruta no tiene roles especificados → permitir acceso
    if (!requiredRoles) return true;

    // 👤 Obtenemos el usuario del request (con tipo seguro)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // 🔐 Si no hay usuario o su rol no está permitido → error 403
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    return true;
  }
}
