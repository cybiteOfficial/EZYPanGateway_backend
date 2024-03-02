/* eslint-disable prettier/prettier */ import { DocumentMiddleware } from "../../middleware/image.middleware";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { FileUpload, FileUploadSchema } from "./entities/file-upload.entity";
import {
  ImageMiddleware,
  ImageAndDocumentMiddleware,
} from "../../middleware/image.middleware";
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileUpload.name, schema: FileUploadSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, AddLogFunction],
})
export class FileUploadModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ImageMiddleware).forRoutes("/file-upload/image-upload");
    consumer.apply(DocumentMiddleware).forRoutes("/file-upload/pdf-upload");
    consumer
      .apply(ImageAndDocumentMiddleware)
      .forRoutes("/file-upload/document-upload");
    // consumer.apply().forRoutes('/add', '/:id');
  }
}
