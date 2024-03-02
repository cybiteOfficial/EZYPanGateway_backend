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
} from '@nestjs/common';
import { ImageMiddleware } from '../../middleware/image.middleware';
import { Query, UseInterceptors } from '@nestjs/common/decorators';
import { UploadedFile } from '@nestjs/common/decorators';

import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  //-------------------------------------------------------------------------
  /***
   * create new Banner
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  @UseInterceptors(ImageMiddleware)
  register(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.bannerService.add(createBannerDto, file, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Banners
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.bannerService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Banner
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.bannerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Banner
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.bannerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update Banner
   */
  //-------------------------------------------------------------------------
  @Put('/update')
  @UseInterceptors(ImageMiddleware)
  update(
    @Query('id') id: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.bannerService.update_by_id(id, file, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove Banner
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.bannerService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Banner
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.bannerService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.bannerService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * change show on web of Banner
   */
  //-------------------------------------------------------------------------

  @Put('/change-showonweb')
  changeShowOnweb(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.bannerService.changeShowOnWeb(id, res, req);
  }
}
