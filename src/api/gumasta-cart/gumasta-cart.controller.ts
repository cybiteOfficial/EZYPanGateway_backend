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
import { GumastaCartService } from './gumasta-cart.service';

@Controller('gumasta-cart')
export class GumastaCartController {
  constructor(private readonly gumastaCartService: GumastaCartService) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.gumastaCartService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaCartService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove cart
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaCartService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * checkout
   */
  //-------------------------------------------------------------------------

  @Post('/checkout')
  checkout(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaCartService.checkout(req, res);
  }
}
