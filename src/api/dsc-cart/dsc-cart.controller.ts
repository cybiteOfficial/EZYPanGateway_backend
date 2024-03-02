import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { DscCartService } from './dsc-cart.service';

@Controller('dsc-cart')
export class DscCartController {
  constructor(private readonly DscCartService: DscCartService) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.DscCartService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.DscCartService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove cart
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.DscCartService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * checkout
   */
  //-------------------------------------------------------------------------

  @Post('/checkout')
  checkout(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.DscCartService.checkout(req, res);
  }
}
