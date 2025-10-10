// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** DTO interno del servicio (no el de controller) */
interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  etiqueta?: string;
  imagenUrl?: string;
  specFileUrl?: string; // ✅ nuevo campo
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

  // 📦 Obtener todos los productos
  async getAll() {
    return this.prisma.product.findMany();
  }

  // 🔎 Obtener producto por ID
  async getById(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  // 🛠️ Crear producto
  async create(data: CreateProductDto) {
    const cleanData: CreateProductDto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      stock: data.stock,
      categoria: data.categoria,
      etiqueta: data.etiqueta,
      imagenUrl: data.imagenUrl,
      specFileUrl: data.specFileUrl, // ✅ agregado
    };

    return this.prisma.product.create({ data: cleanData });
  }

  // ✏️ Actualizar producto
  async update(id: number, data: Partial<CreateProductDto>) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const cleanData: Partial<CreateProductDto> = {};

    if (data.nombre !== undefined) cleanData.nombre = data.nombre;
    if (data.descripcion !== undefined)
      cleanData.descripcion = data.descripcion;
    if (data.precio !== undefined) cleanData.precio = data.precio;
    if (data.stock !== undefined) cleanData.stock = data.stock;
    if (data.categoria !== undefined) cleanData.categoria = data.categoria;
    if (data.etiqueta !== undefined) cleanData.etiqueta = data.etiqueta;
    if (data.imagenUrl !== undefined) cleanData.imagenUrl = data.imagenUrl;
    if (data.specFileUrl !== undefined)
      cleanData.specFileUrl = data.specFileUrl;
    if (data.estado !== undefined) cleanData.estado = data.estado;

    // 🧠 Estado automático según stock
    if (data.stock !== undefined) {
      if (data.stock <= 0) {
        cleanData.estado = 'agotado';
      } else if (data.stock > 0 && producto.estado === 'agotado') {
        cleanData.estado = 'activo';
      }
    }

    // ⚙️ Si la imagen cambió, eliminar la anterior del bucket
    if (data.imagenUrl && data.imagenUrl !== producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    // ⚙️ Si el archivo de especificaciones cambió, eliminar el anterior
    if (data.specFileUrl && data.specFileUrl !== producto.specFileUrl) {
      await this.deleteSpecFileFromBucket(producto.specFileUrl);
    }

    return this.prisma.product.update({
      where: { id },
      data: cleanData,
    });
  }

  // 🗑️ Eliminar producto + recursos de Supabase
  async delete(id: number) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    // ⚠️ Verificar si aún tiene stock
    if (producto.stock > 0) {
      throw new Error(
        `⚠️ No se puede eliminar el producto "${producto.nombre}" porque aún tiene ${producto.stock} unidades en stock.`,
      );
    }

    // 🧹 Eliminar imagen si existe
    if (producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    // 🧹 Eliminar archivo de especificaciones si existe
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

      if (error) {
        console.error('❌ Error al borrar imagen del bucket:', error.message);
      } else {
        console.log(`🗑️ Imagen eliminada del bucket: ${path}`);
      }
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

      if (error) {
        console.error(
          '❌ Error al borrar archivo de especificaciones:',
          error.message,
        );
      } else {
        console.log(
          `🗑️ Archivo de especificaciones eliminado del bucket: ${path}`,
        );
      }
    } catch (err) {
      console.error('⚠️ Error interno al borrar especificación:', err);
    }
  }
}
