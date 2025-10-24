import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import type { Configuracion, Categoria, Etiqueta } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateConfig(
    @Body() body: { whatsapp: string },
  ): Promise<Configuracion> {
    return this.configService.updateConfig(body.whatsapp);
  }

  // =============================
  // 🟣 MODO MANTENIMIENTO
  // =============================

  /** 🔹 GET /config/mantenimiento → devuelve estado actual */
  @Get('mantenimiento')
  async getMaintenance(): Promise<{ mantenimiento: boolean }> {
    const mantenimiento = await this.configService.getMaintenance();
    return { mantenimiento };
  }

  /** 🔹 PUT /config/mantenimiento → activa o desactiva mantenimiento */
  @Put('mantenimiento')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async setMaintenance(
    @Body() body: { mantenimiento: boolean },
  ): Promise<Configuracion> {
    return this.configService.setMaintenance(body.mantenimiento);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addCategoria(@Body() body: { nombre: string }): Promise<Categoria> {
    return this.configService.addCategoria(body.nombre);
  }

  /** ✏️ PUT /config/categorias/:id → actualiza el nombre de una categoría */
  @Put('categorias/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addEtiqueta(
    @Body() body: { nombre: string; color: string },
  ): Promise<Etiqueta> {
    return this.configService.addEtiqueta(body.nombre, body.color);
  }

  /** 🔹 PUT /config/etiquetas/:id → actualiza el color de una etiqueta */
  @Put('etiquetas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateEtiqueta(
    @Param('id') id: string,
    @Body() body: { color: string },
  ): Promise<Etiqueta> {
    return this.configService.updateEtiqueta(Number(id), body.color);
  }

  /** 🔹 DELETE /config/etiquetas/:id → elimina una etiqueta */
  @Delete('etiquetas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteEtiqueta(@Param('id') id: string): Promise<Etiqueta> {
    return this.configService.deleteEtiqueta(Number(id));
  }
}
