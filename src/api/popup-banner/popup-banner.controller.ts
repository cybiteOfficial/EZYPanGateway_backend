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
  Query,
} from '@nestjs/common';

import { PopupBannerService } from './popup-banner.service';
import { CreatePopupBannerDto } from './dto/create-popup-banner.dto';
import { UpdatePopupBannerDto } from './dto/update-popup-banner.dto';
import { ImageMiddleware } from '../../middleware/image.middleware';

@Controller('popup-banner')
export class PopupBannerController {
  constructor(private readonly popupBannerService: PopupBannerService) {}

  //-------------------------------------------------------------------------
  /***
   * create new PopupBanner
   */
  //-------------------------------------------------------------------------

  // @Post('/add')
  // @UseInterceptors(ImageMiddleware)
  // register(
  //   @Body() createPopupBannerDto: CreatePopupBannerDto,
  //   @UploadedFile()
  //   file: Express.Multer.File,
  //   @Res() res: any,
  //   @Req() req: any,
  // ) {
  //   return this.popupBannerService.add(createPopupBannerDto, file, res, req);
  // }

  //-------------------------------------------------------------------------
  /***
   * find all PopupBanners
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.popupBannerService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all PopupBanners for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.popupBannerService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find PopupBanner
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.popupBannerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find PopupBanner for admin
   */
  //-------------------------------------------------------------------------

  @Get('/view/admin')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.popupBannerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update PopupBanner
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  @UseInterceptors(ImageMiddleware)
  update(
    @Query('id') id: string,
    @Body() updatePopupBannerDto: UpdatePopupBannerDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.popupBannerService.update_by_id(
      id,
      updatePopupBannerDto,
      file,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove PopupBanner
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.popupBannerService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of PopupBanner
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.popupBannerService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/')
  filter(@Req() req: any, @Res() res: any) {
    return this.popupBannerService.allWithFilters(req, res);
  }
}
