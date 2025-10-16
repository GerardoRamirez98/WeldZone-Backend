// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 📦 GET /products — obtener todos los productos
  @Get()
  async getProducts() {
    return this.productsService.getAll();
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
}
