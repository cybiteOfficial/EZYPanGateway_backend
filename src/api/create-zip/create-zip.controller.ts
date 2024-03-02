import { Controller, Get, Res, Req, Post } from '@nestjs/common';
import { ZipFile } from './entities/create-zip.entity';
import { ZipFileService } from './create-zip.service';

@Controller('zip')
export class ZipFileController {
  constructor(private readonly ZipFileService: ZipFileService) {}

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/download-zip')
  downloadZip(@Req() req: any, @Res() res: any) {
    return this.ZipFileService.downloadZip(req, res);
  }
}
