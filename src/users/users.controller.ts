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
import { Users } from '@prisma/client'; // 👈 Cambio aquí (de User → Users)
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard) // 👈 Todas las rutas requieren estar autenticado
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Crear usuario (solo si es admin)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('role') role: string,
  ): Promise<Users> {
    // 👈 Ajustado el tipo de retorno
    return await this.usersService.create(username, password, role);
  }

  // ✅ Listar usuarios (solo autenticado)
  @Get()
  async findAll(): Promise<Users[]> {
    // 👈 Ajustado el tipo de retorno
    return await this.usersService.findAll();
  }

  // ✅ Eliminar usuario (solo si es admin)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string): Promise<Users> {
    // 👈 Ajustado el tipo
    return await this.usersService.delete(Number(id));
  }
}
