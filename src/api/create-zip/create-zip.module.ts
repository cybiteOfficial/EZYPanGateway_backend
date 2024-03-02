import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZipFile, ZipFileSchema } from './entities/create-zip.entity';
import { ZipFileController } from './create-zip.controller';
import { ZipFileService } from './create-zip.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ZipFile.name, schema: ZipFileSchema }]),
  ],
  controllers: [ZipFileController],
  providers: [ZipFileService],
})
export class ZipFileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
