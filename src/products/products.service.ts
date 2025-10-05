import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  etiqueta?: string;
  imagenUrl?: string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // 📦 Obtener todos los productos
  async getAll() {
    return this.prisma.product.findMany();
  }

  // 🔎 Obtener producto por ID
  async getById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  // 🛠️ Crear producto (✅ ahora tipado y seguro)
  async create(data: CreateProductDto) {
    const cleanData: CreateProductDto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      stock: data.stock,
      categoria: data.categoria,
      etiqueta: data.etiqueta,
      imagenUrl: data.imagenUrl,
    };

    return this.prisma.product.create({
      data: cleanData,
    });
  }

  // ✏️ Actualizar producto (✅ también tipado)
  async update(id: number, data: Partial<CreateProductDto>) {
    const cleanData: Partial<CreateProductDto> = {};

    if (data.nombre) cleanData.nombre = data.nombre;
    if (data.descripcion) cleanData.descripcion = data.descripcion;
    if (data.precio) cleanData.precio = data.precio;
    if (data.stock) cleanData.stock = data.stock;
    if (data.categoria) cleanData.categoria = data.categoria;
    if (data.etiqueta) cleanData.etiqueta = data.etiqueta;
    if (data.imagenUrl) cleanData.imagenUrl = data.imagenUrl;

    return this.prisma.product.update({
      where: { id },
      data: cleanData,
    });
  }

  // 🗑️ Eliminar producto
  async delete(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
