import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos
  async getAll() {
    return this.prisma.product.findMany();
  }

  // Obtener por ID
  async getById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  // Crear
  async create(data: {
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    categoria?: string;
    etiqueta?: string;
    imagenUrl?: string;
  }) {
    return this.prisma.product.create({ data });
  }

  // Actualizar
  async update(
    id: number,
    data: Partial<{
      nombre: string;
      descripcion?: string;
      precio: number;
      stock: number;
      categoria?: string;
      etiqueta?: string;
      imagenUrl?: string;
    }>,
  ) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Eliminar
  async delete(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
