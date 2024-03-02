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
import { OtherServiceService } from './other-service.service';

@Controller('other-service')
export class OtherServiceController {
  constructor(private readonly otherServiceService: OtherServiceService) {}

  //-------------------------------------------------------------------------
  /***
   * create new OtherService
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.otherServiceService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all OtherServices
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.otherServiceService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find OtherService
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.otherServiceService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find OtherService for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.otherServiceService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update OtherService
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.otherServiceService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove OtherService
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.otherServiceService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of OtherService
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.otherServiceService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.otherServiceService.allWithFilters(req, res);
  }
}
