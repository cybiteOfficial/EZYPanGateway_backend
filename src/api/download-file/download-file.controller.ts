import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { DownloadFileService } from './download-file.service';

@Controller('download-file')
export class DownloadFileController {
  constructor(private readonly downloadFileService: DownloadFileService) {}

  //-------------------------------------------------------------------------
  /***
   * create new DownloadFile
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.downloadFileService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all DownloadFiles without token
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.downloadFileService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all DownloadFiles with token
   */
  //-------------------------------------------------------------------------

  @Get('/list/web')
  findAllWithToken(@Res() res: any, @Req() req: any) {
    return this.downloadFileService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find DownloadFile
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.downloadFileService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update DownloadFile
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.downloadFileService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove DownloadFile
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.downloadFileService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of DownloadFile
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.downloadFileService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.downloadFileService.allWithFilters(req, res);
  }
}
