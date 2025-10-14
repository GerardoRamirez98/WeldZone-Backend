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
import type { Configuracion, Categoria, Etiqueta } from '@prisma/client';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // =============================
  // 🟢 WHATSAPP (CONFIGURACIÓN)
  // =============================

  /** 🔹 GET /config → devuelve configuración actual */
  @Get()
  async getConfig(): Promise<Configuracion> {
    return this.configService.getConfig();
  }

  /** 🔹 PUT /config → actualiza número de WhatsApp */
  @Put()
  async updateConfig(
    @Body() body: { whatsapp: string },
  ): Promise<Configuracion> {
    return this.configService.updateConfig(body.whatsapp);
  }

  // =============================
  // 🟡 CATEGORÍAS
  // =============================

  /** 🔹 GET /config/categorias → lista todas las categorías */
  @Get('categorias')
  async getCategorias(): Promise<Categoria[]> {
    return this.configService.getCategorias();
  }

  /** 🔹 POST /config/categorias → crea una nueva categoría */
  @Post('categorias')
  async addCategoria(@Body() body: { nombre: string }): Promise<Categoria> {
    return this.configService.addCategoria(body.nombre);
  }

  /** ✏️ PUT /config/categorias/:id → actualiza el nombre de una categoría */
  @Put('categorias/:id')
  async updateCategoria(
    @Param('id') id: string,
    @Body() body: { nombre: string },
  ): Promise<Categoria> {
    const updated: Categoria = await this.configService.updateCategoria(
      Number(id),
      body.nombre,
    );
    return updated;
  }

  /** 🔹 DELETE /config/categorias/:id → elimina una categoría */
  @Delete('categorias/:id')
  async deleteCategoria(@Param('id') id: string): Promise<Categoria> {
    return this.configService.deleteCategoria(Number(id));
  }

  // =============================
  // 🟣 ETIQUETAS
  // =============================

  /** 🔹 GET /config/etiquetas → lista todas las etiquetas */
  @Get('etiquetas')
  async getEtiquetas(): Promise<Etiqueta[]> {
    return this.configService.getEtiquetas();
  }

  /** 🔹 POST /config/etiquetas → crea una nueva etiqueta */
  @Post('etiquetas')
  async addEtiqueta(
    @Body() body: { nombre: string; color: string },
  ): Promise<Etiqueta> {
    return this.configService.addEtiqueta(body.nombre, body.color);
  }

  /** 🔹 PUT /config/etiquetas/:id → actualiza el color de una etiqueta */
  @Put('etiquetas/:id')
  async updateEtiqueta(
    @Param('id') id: string,
    @Body() body: { color: string },
  ): Promise<Etiqueta> {
    return this.configService.updateEtiqueta(Number(id), body.color);
  }

  /** 🔹 DELETE /config/etiquetas/:id → elimina una etiqueta */
  @Delete('etiquetas/:id')
  async deleteEtiqueta(@Param('id') id: string): Promise<Etiqueta> {
    return this.configService.deleteEtiqueta(Number(id));
  }
}
