import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Users } from '@prisma/client'; // 👈 cambio de User → Users

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Crear usuario con contraseña encriptada
  async create(
    username: string,
    password: string,
    role = 'user',
  ): Promise<Users> {
    const passwordHash = await bcrypt.hash(password, 10);
    return await this.prisma.users.create({
      data: { username, passwordHash, role },
    });
  }

  // ✅ Listar todos los usuarios
  async findAll(): Promise<Users[]> {
    return await this.prisma.users.findMany();
  }

  // ✅ Buscar usuario por username
  async findByUsername(username: string): Promise<Users | null> {
    return await this.prisma.users.findUnique({
      where: { username },
    });
  }

  // ✅ Eliminar usuario
  async delete(id: number): Promise<Users> {
    return await this.prisma.users.delete({
      where: { id },
    });
  }
}
