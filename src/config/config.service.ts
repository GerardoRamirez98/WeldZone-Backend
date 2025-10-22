import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Configuracion, Categoria, Etiqueta } from '@prisma/client';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ ====== CONFIGURACIÓN GENERAL (WhatsApp) ======
  async getConfig(): Promise<Configuracion> {
    const config: Configuracion = await this.prisma.configuracion.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, whatsapp: '' },
    });
    return config;
  }

  async updateConfig(whatsapp: string): Promise<Configuracion> {
    const updated: Configuracion = await this.prisma.configuracion.upsert({
      where: { id: 1 },
      update: { whatsapp },
      create: { id: 1, whatsapp },
    });
    return updated;
  }

  // 🆕 ====== MODO MANTENIMIENTO ======
  async getMaintenance(): Promise<boolean> {
    const config: Configuracion = await this.getConfig();
    return Boolean(config.mantenimiento);
  }

  async setMaintenance(maintenance: boolean): Promise<Configuracion> {
    const updated = await this.prisma.configuracion.upsert({
      where: { id: 1 },
      update: { mantenimiento: maintenance },
      create: { id: 1, whatsapp: '', mantenimiento: maintenance },
    });
    return updated;
  }

  // 🟡 ====== CATEGORÍAS ======
  async getCategorias(): Promise<Categoria[]> {
    const categorias: Categoria[] = await this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    return categorias;
  }

  async addCategoria(nombre: string): Promise<Categoria> {
    const nueva: Categoria = await this.prisma.categoria.create({
      data: { nombre },
    });
    return nueva;
  }

  // ✏️ Actualizar nombre de una categoría
  async updateCategoria(id: number, nombre: string): Promise<Categoria> {
    const updated = await this.prisma.categoria.update({
      where: { id },
      data: { nombre },
    });
    return updated;
  }

  async deleteCategoria(id: number): Promise<Categoria> {
    const eliminada: Categoria = await this.prisma.categoria.delete({
      where: { id },
    });
    return eliminada;
  }

  // 🟣 ====== ETIQUETAS ======
  async getEtiquetas(): Promise<Etiqueta[]> {
    const etiquetas: Etiqueta[] = await this.prisma.etiqueta.findMany({
      orderBy: { nombre: 'asc' },
    });
    return etiquetas;
  }

  async addEtiqueta(nombre: string, color: string): Promise<Etiqueta> {
    const nueva: Etiqueta = await this.prisma.etiqueta.create({
      data: { nombre, color },
    });
    return nueva;
  }

  async updateEtiqueta(id: number, color: string): Promise<Etiqueta> {
    const actualizada: Etiqueta = await this.prisma.etiqueta.update({
      where: { id },
      data: { color },
    });
    return actualizada;
  }

  async deleteEtiqueta(id: number): Promise<Etiqueta> {
    const eliminada: Etiqueta = await this.prisma.etiqueta.delete({
      where: { id },
    });
    return eliminada;
  }
}
