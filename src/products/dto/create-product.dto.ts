import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsNumber()
  precio!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  etiquetaId?: number;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  specFileUrl?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
