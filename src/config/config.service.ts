import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Configuraciones, Categorias, Etiquetas } from '@prisma/client';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ ====== CONFIGURACIÓN GENERAL (WhatsApp) ======
  async getConfig(): Promise<Configuraciones> {
    const config = await this.prisma.configuraciones.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, whatsapp: '' },
    });
    return config;
  }

  async updateConfig(whatsapp: string): Promise<Configuraciones> {
    const updated = await this.prisma.configuraciones.upsert({
      where: { id: 1 },
      update: { whatsapp },
      create: { id: 1, whatsapp },
    });
    return updated;
  }

  // 🟡 ====== CATEGORÍAS ======
  async getCategorias(): Promise<Categorias[]> {
    return await this.prisma.categorias.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async addCategoria(nombre: string): Promise<Categorias> {
    return await this.prisma.categorias.create({
      data: { nombre },
    });
  }

  // ✏️ Actualizar nombre de una categoría
  async updateCategoria(id: number, nombre: string): Promise<Categorias> {
    return await this.prisma.categorias.update({
      where: { id },
      data: { nombre },
    });
  }

  async deleteCategoria(id: number): Promise<Categorias> {
    return await this.prisma.categorias.delete({
      where: { id },
    });
  }

  // 🟣 ====== ETIQUETAS ======
  async getEtiquetas(): Promise<Etiquetas[]> {
    return await this.prisma.etiquetas.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async addEtiqueta(nombre: string, color: string): Promise<Etiquetas> {
    return await this.prisma.etiquetas.create({
      data: { nombre, color },
    });
  }

  async updateEtiqueta(id: number, color: string): Promise<Etiquetas> {
    return await this.prisma.etiquetas.update({
      where: { id },
      data: { color },
    });
  }

  async deleteEtiqueta(id: number): Promise<Etiquetas> {
    return await this.prisma.etiquetas.delete({
      where: { id },
    });
  }
}
