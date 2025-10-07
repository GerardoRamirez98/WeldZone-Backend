import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Crear usuario con contraseña encriptada
  async create(
    username: string,
    password: string,
    role = 'user',
  ): Promise<User> {
    const passwordHash: string = await bcrypt.hash(password, 10);
    return await this.prisma.user.create({
      data: { username, passwordHash, role },
    });
  }

  // ✅ Listar todos los usuarios
  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  // ✅ Buscar usuario por username
  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  // ✅ Eliminar usuario
  async delete(id: number): Promise<User> {
    return await this.prisma.user.delete({ where: { id } });
  }
}
