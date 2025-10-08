import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// DTO interno temporal (puedes reemplazarlo por tus DTOs reales)
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
  private supabase: ReturnType<typeof createClient>;
  private readonly bucket = process.env.SUPABASE_BUCKET || 'products';

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL ?? '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
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

    if (producto.imagenUrl) {
      await this.deleteImageFromBucket(producto.imagenUrl);
    }

    return this.prisma.product.delete({ where: { id } });
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
  // 🧰 Utilidad: borrar imagen del bucket
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
        // ✅ acceso seguro al mensaje de error
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error);
        console.error('❌ Error al borrar imagen del bucket:', message);
      } else {
        console.log(`🗑️ Imagen eliminada del bucket: ${path}`);
      }
    } catch (err) {
      console.error(
        '⚠️ Error interno al procesar la eliminación de imagen:',
        err,
      );
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
}
