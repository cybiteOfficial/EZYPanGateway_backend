import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Delete,
  Res,
  Req,
  Put,
} from '@nestjs/common';
import { RefundRequestService } from './refund-request.service';

@Controller('refund-request')
export class RefundRequestController {
  constructor(private readonly refundRequestService: RefundRequestService) {}

  //-------------------------------------------------------------------------
  /***
   * create new refund-request
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.refundRequestService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.refundRequestService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/pagination')
  filterForAdmin(@Req() req: any, @Res() res: any) {
    return this.refundRequestService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update status of application
   */
  //-------------------------------------------------------------------------

  @Put('/update-status')
  changeSatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.refundRequestService.updateStatus(id, res, req);
  }
}
