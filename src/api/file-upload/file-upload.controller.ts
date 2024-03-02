/* eslint-disable prettier/prettier */
import {
  DocumentMiddleware,
  ImageAndDocumentMiddleware,
} from "../../middleware/image.middleware";
import { FileUpload } from "./entities/file-upload.entity";
import { UpdateFileUploadDto } from "./dto/update-file-upload.dto";
import { CreateFileUploadDto } from "./dto/create-file-upload.dto";
import { FileUploadService } from "./file-upload.service";
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ImageMiddleware } from "../../middleware/image.middleware";

@Controller("file-upload")
export class FileUploadController {
  constructor(private readonly FileUploadService: FileUploadService) {}

  //-------------------------------------------------------------------------
  /***
   * upload files
   */
  //-------------------------------------------------------------------------

  @Post("/pdf-upload")
  @UseInterceptors(DocumentMiddleware)
  FileUpload(
    @Req() req: any,
    @Body() createMenuLinksDto: CreateFileUploadDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any
  ) {
    return this.FileUploadService.FileUpload(
      req,
      createMenuLinksDto,
      file,
      res
    );
  }

  //-------------------------------------------------------------------------
  /***
   * upload images
   */
  //-------------------------------------------------------------------------

  @Post("/image-upload")
  @UseInterceptors(ImageMiddleware)
  imageUpload(
    @Req() req: any,
    @Body() createMenuLinksDto: CreateFileUploadDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any
  ) {
    return this.FileUploadService.ImageUpload(
      req,
      createMenuLinksDto,
      file,
      res
    );
  }
  //-------------------------------------------------------------------------
  /***
   * upload images
   */
  //-------------------------------------------------------------------------

  @Post("/document-upload")
  @UseInterceptors(ImageAndDocumentMiddleware)
  docUpload(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any
  ) {
    return this.FileUploadService.docUpload(
      req,

      file,
      res
    );
  }
}
