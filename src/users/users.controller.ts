import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // ✅ Guard JWT
import { RolesGuard } from '../auth/roles.guard'; // ✅ Guard de roles
import { Roles } from '../auth/roles.decorator'; // ✅ Decorador de roles

@Controller('users')
@UseGuards(JwtAuthGuard) // 👈 Todas las rutas requieren estar autenticado
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Crear usuario (solo si es admin)
  @Post()
  @UseGuards(RolesGuard) // 👈 Aplica el RolesGuard
  @Roles('admin') // 👈 Solo usuarios con rol 'admin'
  async create(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('role') role: string,
  ): Promise<User> {
    return await this.usersService.create(username, password, role);
  }

  // ✅ Listar usuarios (solo autenticado)
  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  // ✅ Eliminar usuario (solo si es admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string): Promise<User> {
    return await this.usersService.delete(Number(id));
  }
}
