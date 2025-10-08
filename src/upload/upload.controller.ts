import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';

/** Tipo mínimo, 100% seguro para el archivo subido */
type SafeFile = {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
};

/** Type guard: confirma en tiempo de compilación que el objeto es un SafeFile */
function isSafeFile(input: unknown): input is SafeFile {
  const f = input as {
    originalname?: unknown;
    buffer?: unknown;
    mimetype?: unknown;
  };
  const hasName = typeof f?.originalname === 'string';
  const hasBuffer =
    typeof f?.buffer !== 'undefined' &&
    (typeof Buffer !== 'undefined' ? Buffer.isBuffer(f.buffer) : true);
  const okMime =
    typeof f?.mimetype === 'undefined' || typeof f?.mimetype === 'string';
  return (
    typeof input === 'object' &&
    input !== null &&
    hasName &&
    hasBuffer &&
    okMime
  );
}

interface UploadResponse {
  message: string;
  url: string;
}

@Controller('upload')
export class UploadController {
  // Tipado exacto del cliente sin conflictos de genéricos
  private readonly supabase: ReturnType<typeof createClient>;
  private readonly bucket = process.env.SUPABASE_BUCKET || 'products';

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      '';
    this.supabase = createClient(url, key);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: unknown): Promise<UploadResponse> {
    // ✅ Validación estricta del archivo
    if (!isSafeFile(file)) {
      throw new BadRequestException('Archivo inválido o no recibido');
    }

    // Desde aquí, `file` es SafeFile (sin "unsafe" para ESLint/TS)
    const originalName: string = file.originalname;
    const extension: string = path.extname(originalName) || '.jpg';
    const randomName: string = `${crypto.randomBytes(8).toString('hex')}${extension}`;
    const mimeType: string = file.mimetype ?? 'application/octet-stream';

    // 📤 Subir a Supabase
    const uploadResult = await this.supabase.storage
      .from(this.bucket)
      .upload(randomName, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      const msg =
        typeof uploadResult.error.message === 'string'
          ? uploadResult.error.message
          : 'Error desconocido al subir la imagen';
      throw new BadRequestException(`Error al subir la imagen: ${msg}`);
    }

    // 🔗 URL pública
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(randomName);

    return {
      message: '✅ Imagen subida correctamente',
      url: data.publicUrl,
    };
  }
}
