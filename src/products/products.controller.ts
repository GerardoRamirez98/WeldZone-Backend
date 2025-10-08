import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
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
    return this.productsService.getById(id);
  }

  // 🛠️ POST /products — crear nuevo producto
  @Post()
  async createProduct(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  // ✏️ PUT /products/:id — actualizar producto existente
  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.update(id, body);
  }

  // 🗑️ DELETE /products/:id — eliminar producto + imagen
  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
