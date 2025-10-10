import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadSpecsController } from './upload-specs.controller';

@Module({
  controllers: [UploadController, UploadSpecsController],
})
export class UploadModule {}
