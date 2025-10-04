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

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products
  @Get()
  async getProducts() {
    return this.productsService.getAll();
  }

  // GET /products/:id
  @Get(':id')
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getById(id);
  }

  // POST /products
  @Post()
  async createProduct(@Body() body: any) {
    return this.productsService.create(body);
  }

  // PUT /products/:id
  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.productsService.update(id, body);
  }

  // DELETE /products/:id
  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
