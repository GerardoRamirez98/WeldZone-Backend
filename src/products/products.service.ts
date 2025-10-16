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
      throw new Error(
        '❌ Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    }) as unknown as SupabaseClient;
  }

  // 📦 Obtener todos los productos con relaciones
  async getAll() {
    return this.prisma.product.findMany({
      include: {
        categoria: { select: { id: true, nombre: true } },
        etiqueta: { select: { id: true, nombre: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  // 🛠️ Crear producto con relaciones por ID
  async create(data: CreateProductDto) {
    const cleanData: Prisma.ProductCreateInput = {
      nombre: data.nombre,
      descripcion: data.descripcion ?? null,
      precio: data.precio,
      imagenUrl: data.imagenUrl ?? null,
      specFileUrl: data.specFileUrl ?? null,
      estado: data.estado ?? 'activo',
    };

    // 🔗 Conectar categoría por ID
    if (data.categoriaId) {
      cleanData.categoria = { connect: { id: data.categoriaId } };
    }

    // 🔗 Conectar etiqueta por ID
    if (data.etiquetaId) {
      cleanData.etiqueta = { connect: { id: data.etiquetaId } };
    }

    return this.prisma.product.create({ data: cleanData });
  }

  // ✏️ Actualizar producto (seguro con relaciones)
  async update(id: number, data: Partial<CreateProductDto>) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const cleanData: Prisma.ProductUpdateInput = {
      nombre: data.nombre ?? undefined,
      descripcion: data.descripcion ?? undefined,
      precio: data.precio ?? undefined,
      imagenUrl: data.imagenUrl ?? undefined,
      specFileUrl: data.specFileUrl ?? undefined,
      estado: data.estado ?? undefined,
    };

    // 🔗 Conectar categoría si viene ID
    if (data.categoriaId) {
      cleanData.categoria = { connect: { id: data.categoriaId } };
    }

    // 🔗 Conectar etiqueta si viene ID
    if (data.etiquetaId) {
      cleanData.etiqueta = { connect: { id: data.etiquetaId } };
    }

    // ⚙️ Reemplazar archivos si cambiaron
    if (data.imagenUrl && data.imagenUrl !== producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }
    if (data.specFileUrl && data.specFileUrl !== producto.specFileUrl) {
      await this.deleteSpecFileFromBucket(producto.specFileUrl);
    }

    return this.prisma.product.update({
      where: { id },
      data: cleanData,
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
