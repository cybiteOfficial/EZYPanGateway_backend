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
import { ItrCartServices } from './itr-cart.service';

@Controller('itr-cart')
export class ItrCartController {
  constructor(private readonly ItrCartServices: ItrCartServices) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.ItrCartServices.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.ItrCartServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove cart
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.ItrCartServices.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * checkout
   */
  //-------------------------------------------------------------------------

  @Post('/checkout')
  checkout(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.ItrCartServices.checkout(req, res);
  }
}
