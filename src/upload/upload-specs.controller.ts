// src/upload-specs.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import multer from 'multer';

type SafeFile = {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
};

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
  path: string;
}

// upload-specs.controller.ts
@Controller('upload-specs')
export class UploadSpecsController {
  private readonly bucket =
    process.env.SUPABASE_SPECS_BUCKET || 'products-specs';

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Formato no permitido'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadSpecFile(
    @UploadedFile() file: unknown,
    @Body() body: { oldPath?: string },
  ): Promise<UploadResponse> {
    const oldPath = body.oldPath;
    if (!isSafeFile(file)) {
      throw new BadRequestException('Archivo inválido o no recibido');
    }

    // ⚙️ Crea el cliente en tiempo de ejecución
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const allowed = ['.pdf', '.doc', '.docx'];
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(extension)) {
      throw new BadRequestException(
        'Formato no permitido. Solo se aceptan PDF, DOC o DOCX.',
      );
    }

    if (oldPath) {
      try {
        await supabase.storage.from(this.bucket).remove([oldPath]);
      } catch {
        console.warn('⚠️ No se pudo eliminar el archivo anterior.');
      }
    }

    const randomName = `${crypto
      .randomBytes(10)
      .toString('hex')}-${Date.now()}${extension}`;

    const mimeType = file.mimetype ?? 'application/octet-stream';

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(randomName, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('❌ Error detallado de Supabase:', error);
      throw new BadRequestException(
        `Error al subir el archivo: ${error.message}`,
      );
    }

    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(randomName);

    return {
      message: '✅ Archivo de especificaciones subido correctamente',
      url: data.publicUrl,
      path: randomName,
    };
  }
}
