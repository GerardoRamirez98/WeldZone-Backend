import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import type { Configuraciones, Categorias, Etiquetas } from '@prisma/client';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // =============================
  // 🟢 WHATSAPP (CONFIGURACIÓN)
  // =============================

  /** 🔹 GET /config → devuelve configuración actual */
  @Get()
  async getConfig(): Promise<Configuraciones> {
    return this.configService.getConfig();
  }

  /** 🔹 PUT /config → actualiza número de WhatsApp */
  @Put()
  async updateConfig(
    @Body() body: { whatsapp: string },
  ): Promise<Configuraciones> {
    return this.configService.updateConfig(body.whatsapp);
  }

  // =============================
  // 🟡 CATEGORÍAS
  // =============================

  /** 🔹 GET /config/categorias → lista todas las categorías */
  @Get('categorias')
  async getCategorias(): Promise<Categorias[]> {
    return this.configService.getCategorias();
  }

  /** 🔹 POST /config/categorias → crea una nueva categoría */
  @Post('categorias')
  async addCategoria(@Body() body: { nombre: string }): Promise<Categorias> {
    return this.configService.addCategoria(body.nombre);
  }

  /** ✏️ PUT /config/categorias/:id → actualiza el nombre de una categoría */
  @Put('categorias/:id')
  async updateCategoria(
    @Param('id') id: string,
    @Body() body: { nombre: string },
  ): Promise<Categorias> {
    return this.configService.updateCategoria(Number(id), body.nombre);
  }

  /** 🔹 DELETE /config/categorias/:id → elimina una categoría */
  @Delete('categorias/:id')
  async deleteCategoria(@Param('id') id: string): Promise<Categorias> {
    return this.configService.deleteCategoria(Number(id));
  }

  // =============================
  // 🟣 ETIQUETAS
  // =============================

  /** 🔹 GET /config/etiquetas → lista todas las etiquetas */
  @Get('etiquetas')
  async getEtiquetas(): Promise<Etiquetas[]> {
    return this.configService.getEtiquetas();
  }

  /** 🔹 POST /config/etiquetas → crea una nueva etiqueta */
  @Post('etiquetas')
  async addEtiqueta(
    @Body() body: { nombre: string; color: string },
  ): Promise<Etiquetas> {
    return this.configService.addEtiqueta(body.nombre, body.color);
  }

  /** 🔹 PUT /config/etiquetas/:id → actualiza el color de una etiqueta */
  @Put('etiquetas/:id')
  async updateEtiqueta(
    @Param('id') id: string,
    @Body() body: { color: string },
  ): Promise<Etiquetas> {
    return this.configService.updateEtiqueta(Number(id), body.color);
  }

  /** 🔹 DELETE /config/etiquetas/:id → elimina una etiqueta */
  @Delete('etiquetas/:id')
  async deleteEtiqueta(@Param('id') id: string): Promise<Etiquetas> {
    return this.configService.deleteEtiqueta(Number(id));
  }
}
