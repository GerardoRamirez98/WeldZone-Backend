// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient, type SupabaseClient } from '@supabase/supabase-js'; // 👈 CORRECTO: usamos `type` para tipar sin importar runtime

interface CreateProductDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  etiqueta?: string;
  imagenUrl?: string;
  estado?: string; // ✅ NUEVO CAMPO
}

@Injectable()
export class ProductsService {
  private supabase: SupabaseClient; // ✅ Tipado limpio
  private readonly bucket = process.env.SUPABASE_BUCKET || 'products';

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
    }) as unknown as SupabaseClient; // ✅ Cast explícito para evitar advertencias de tipo
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
    };

    return this.prisma.product.create({ data: cleanData });
  }

  // ✏️ Actualizar producto
  async update(id: number, data: Partial<CreateProductDto>) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const cleanData: Partial<CreateProductDto> = {};
    if (data.nombre) cleanData.nombre = data.nombre;
    if (data.descripcion) cleanData.descripcion = data.descripcion;
    if (data.precio) cleanData.precio = data.precio;
    if (data.stock) cleanData.stock = data.stock;
    if (data.categoria) cleanData.categoria = data.categoria;
    if (data.etiqueta) cleanData.etiqueta = data.etiqueta;
    if (data.imagenUrl) cleanData.imagenUrl = data.imagenUrl;
    if (data.estado) cleanData.estado = data.estado;

    // 🧠 Lógica automática de estado según stock
    if (data.stock !== undefined) {
      if (data.stock <= 0) {
        cleanData.estado = 'agotado';
      } else if (data.stock > 0 && producto.estado === 'agotado') {
        cleanData.estado = 'activo';
      }
    }

    // ⚙️ Si la imagen cambió, borrar la anterior del bucket
    if (data.imagenUrl && data.imagenUrl !== producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    return this.prisma.product.update({
      where: { id },
      data: cleanData,
    });
  }

  // 🗑️ Eliminar producto + imagen del bucket
  async delete(id: number) {
    const producto = await this.prisma.product.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    // ⚠️ Verificar si el producto tiene stock disponible
    if (producto.stock > 0) {
      throw new Error(
        `⚠️ No se puede eliminar el producto "${producto.nombre}" porque aún tiene ${producto.stock} unidades en stock.`,
      );
    }

    // ⚙️ Si tiene imagen, eliminarla del bucket Supabase
    if (producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    return this.prisma.product.delete({ where: { id } });
  }

  // 🧰 Eliminar imagen del bucket Supabase
  private async deleteImageFromBucket(publicUrl: string | null) {
    try {
      if (!publicUrl) return;

      const parts = publicUrl.split('/');
      const bucketIndex = parts.indexOf(this.bucket);
      if (bucketIndex === -1) return;

      const path = parts.slice(bucketIndex + 1).join('/');
      if (!path) return;

      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error);
        console.error('❌ Error al borrar imagen del bucket:', message);
      } else {
        console.log(`🗑️ Imagen eliminada del bucket: ${path}`);
      }
    } catch (err) {
      console.error('⚠️ Error interno al procesar eliminación:', err);
    }
  }
}
