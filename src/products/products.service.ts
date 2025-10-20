import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Prisma } from '@prisma/client';

interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId?: number;
  etiquetaId?: number;
  imagenUrl?: string;
  specFileUrl?: string;
  estado?: string;
}

@Injectable()
export class ProductsService {
  private supabase: SupabaseClient;
  private readonly imageBucket = process.env.SUPABASE_BUCKET || 'products';
  private readonly specsBucket =
    process.env.SUPABASE_SPECS_BUCKET || 'product-specs';

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Variables de entorno Supabase faltantes o incorrectas');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    }) as unknown as SupabaseClient;
  }

  // 📦 Obtener todos los productos con relaciones
  // 📦 Obtener todos los productos con relaciones
  async getAll() {
    try {
      return await this.prisma.product.findMany({
        include: {
          categoria: { select: { id: true, nombre: true } },
          etiqueta: { select: { id: true, nombre: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al obtener productos:', error.message);
        throw new Error(`Error al obtener productos: ${error.message}`);
      } else {
        console.error('❌ Error desconocido al obtener productos:', error);
        throw new Error('Error desconocido al obtener productos');
      }
    }
  }

  // 🔍 Obtener producto por ID
  async getById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        categoria: { select: { id: true, nombre: true } },
        etiqueta: { select: { id: true, nombre: true, color: true } },
      },
    });
  }

  // 🛠️ Crear producto con IDs directos
  async create(data: CreateProductDto) {
    const cleanData: Prisma.ProductUncheckedCreateInput = {
      nombre: data.nombre,
      descripcion: data.descripcion ?? null,
      precio: data.precio,
      imagenUrl: data.imagenUrl ?? null,
      specFileUrl: data.specFileUrl ?? null,
      estado: data.estado ?? 'activo',
      categoriaId: data.categoriaId ?? null,
      etiquetaId: data.etiquetaId ?? null,
    };

    return this.prisma.product.create({
      data: cleanData,
      include: {
        categoria: { select: { id: true, nombre: true } },
        etiqueta: { select: { id: true, nombre: true, color: true } },
      },
    });
  }

  // ✏️ Actualizar producto (con control de relaciones)
  async update(id: number, data: Partial<CreateProductDto>) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const cleanData: Prisma.ProductUncheckedUpdateInput = {
      nombre: data.nombre ?? undefined,
      descripcion: data.descripcion ?? undefined,
      precio: data.precio ?? undefined,
      imagenUrl: data.imagenUrl ?? undefined,
      specFileUrl: data.specFileUrl ?? undefined,
      estado: data.estado ?? undefined,
      categoriaId: data.categoriaId ?? producto.categoriaId ?? null,
      etiquetaId: data.etiquetaId ?? producto.etiquetaId ?? null,
    };

    // ⚙️ Si cambió la imagen o archivo, eliminamos el anterior
    if (data.imagenUrl && data.imagenUrl !== producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }
    if (data.specFileUrl && data.specFileUrl !== producto.specFileUrl) {
      await this.deleteSpecFileFromBucket(producto.specFileUrl);
    }

    return this.prisma.product.update({
      where: { id },
      data: cleanData,
      include: {
        categoria: { select: { id: true, nombre: true } },
        etiqueta: { select: { id: true, nombre: true, color: true } },
      },
    });
  }

  // 🗑️ Eliminar producto + archivos en Supabase
  async delete(id: number) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    if (producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    if (producto.specFileUrl) {
      await this.deleteSpecFileFromBucket(producto.specFileUrl);
    }

    return this.prisma.product.delete({ where: { id } });
  }

  // 🧰 Eliminar imagen del bucket Supabase
  private async deleteImageFromBucket(publicUrl: string | null) {
    try {
      if (!publicUrl) return;
      const parts = publicUrl.split('/');
      const bucketIndex = parts.indexOf(this.imageBucket);
      if (bucketIndex === -1) return;
      const path = parts.slice(bucketIndex + 1).join('/');
      if (!path) return;

      const { error } = await this.supabase.storage
        .from(this.imageBucket)
        .remove([path]);
      if (error)
        console.error('❌ Error al borrar imagen del bucket:', error.message);
    } catch (err) {
      console.error('⚠️ Error interno al borrar imagen:', err);
    }
  }

  // 🧰 Eliminar archivo de especificaciones del bucket Supabase
  private async deleteSpecFileFromBucket(publicUrl: string | null) {
    try {
      if (!publicUrl) return;
      const parts = publicUrl.split('/');
      const bucketIndex = parts.indexOf(this.specsBucket);
      if (bucketIndex === -1) return;
      const path = parts.slice(bucketIndex + 1).join('/');
      if (!path) return;

      const { error } = await this.supabase.storage
        .from(this.specsBucket)
        .remove([path]);
      if (error)
        console.error(
          '❌ Error al borrar archivo de especificaciones:',
          error.message,
        );
    } catch (err) {
      console.error('⚠️ Error interno al borrar especificación:', err);
    }
  }
}
