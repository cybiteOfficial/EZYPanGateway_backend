import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { StaticPageService } from './static-page.service';

@Controller('static-page')
export class StaticPageController {
  constructor(private readonly StaticPageService: StaticPageService) {}

  //-------------------------------------------------------------------------
  /***
   * create new StaticPage
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.StaticPageService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all StaticPages
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.StaticPageService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all StaticPages for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.StaticPageService.list(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find StaticPage
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-name')
  findOne(@Query('url') url: string, @Res() res: any, @Req() req: any) {
    return this.StaticPageService.viewByUrl(url, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find StaticPage for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view-with-name')
  findOneForAdmin(@Query('url') url: string, @Res() res: any, @Req() req: any) {
    return this.StaticPageService.viewByUrl(url, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update StaticPage
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.StaticPageService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove StaticPage
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.StaticPageService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of StaticPage
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.StaticPageService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.StaticPageService.allWithFilters(req, res);
  }
}
