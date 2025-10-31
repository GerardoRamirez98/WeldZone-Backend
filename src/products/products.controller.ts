// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 📦 GET /products — obtener todos los productos
  @Get()
  async getProducts(@Query('includeInactive') includeInactive?: string) {
    const include = String(includeInactive).toLowerCase() === 'true';
    const all = await this.productsService.getAll();
    if (include) return all;
    return all.filter((p: any) => p?.estado === 'activo' || p?.activo === true);
  }

  // GET /products/exists?nombre=...  => valida duplicados por nombre (case-insensitive)
  @Get('exists')
  async existsByName(@Query('nombre') nombre?: string) {
    const n = (nombre || '').trim();
    if (!n) return { exists: false };
    const existing = await this.productsService.existsByName(n);
    if (!existing) return { exists: false };
    const inList = existing.estado === 'activo' ? 'productos' : 'eliminados';
    return { exists: true, in: inList };
  }

  // 🔎 GET /products/:id — obtener producto por ID
  @Get(':id')
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.getById(id);
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  // 🛠️ POST /products — crear nuevo producto
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createProduct(@Body() body: CreateProductDto) {
    /**
     * body puede contener:
     * - nombre, descripcion, precio
     * - categoriaId, etiquetaId (relaciones)
     * - imagenUrl, specFileUrl, estado (opcionales)
     */
    return this.productsService.create(body);
  }

  // ✏️ PUT /products/:id — actualizar producto existente
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    const updated = await this.productsService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return updated;
  }

  // 🗑️ DELETE /products/:id — eliminar producto + imagen + archivo de especificaciones
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      const deleted = await this.productsService.delete(id);

      if (!deleted) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return { message: `✅ Producto ${id} eliminado correctamente` };
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      throw new InternalServerErrorException('Error al eliminar el producto');
    }
  }
  // Restaurar producto inactivo
  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async restore(@Param('id', ParseIntPipe) id: number) {
    try {
      const restored = await this.productsService.restore(id);
      if (!restored) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return { message: `Producto ${id} reactivado correctamente` };
    } catch (error) {
      console.error('Error al restaurar producto:', error);
      throw new InternalServerErrorException('Error al restaurar el producto');
    }
  }

  // Eliminación definitiva con validación de contraseña
  @Delete(':id/force')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async forceDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password?: string,
  ) {
    try {
      if (password !== 'admin') {
        throw new ForbiddenException('Contraseña inválida');
      }
      const deleted = await this.productsService.forceDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return { message: `Producto ${id} eliminado definitivamente` };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error en eliminación definitiva:', error);
      throw new InternalServerErrorException('Error al eliminar definitivamente');
    }
  }
}




