import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  precio!: number;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @IsString()
  etiqueta?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  // 👇 nuevo campo para archivo de especificaciones (PDF/DOCX)
  @IsOptional()
  @IsString()
  specFileUrl?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
