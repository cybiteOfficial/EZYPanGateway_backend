import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DocumentMiddleware } from '../../middleware/image.middleware';
import { msmeCartServices } from './msme-cart.service';

@Controller('msme-cart')
export class MsmeCartController {
  constructor(private readonly msmeCartServices: msmeCartServices) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.msmeCartServices.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.msmeCartServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove cart
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.msmeCartServices.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * checkout
   */
  //-------------------------------------------------------------------------

  @Post('/checkout')
  checkout(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.msmeCartServices.checkout(req, res);
  }
}
