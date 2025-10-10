// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  // 👇 también para reemplazar o eliminar especificaciones
  @IsOptional()
  @IsString()
  specFileUrl?: string;
}
