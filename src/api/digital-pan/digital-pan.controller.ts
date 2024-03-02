import { DigitalPanServices } from './digital-pan.service';
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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('digital-pan')
export class DigitalPanController {
  constructor(private readonly DigitalPanServices: DigitalPanServices) {}

  //-------------------------------------------------------------------------
  /***
   * religare-authentication
   */
  //-------------------------------------------------------------------------

  @Post('/religare-auth')
  register(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.religareAuth(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * get wallet balance of user
   */
  //-------------------------------------------------------------------------

  @Post('/currentwallet')
  getWalletBallence(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.religareAuth(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * history
   */
  //-------------------------------------------------------------------------

  @Post('/history')
  history(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.history(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * admin listing
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list')
  listForAdmin(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.history(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * check transaction status
   */
  //-------------------------------------------------------------------------

  @Post('/transaction-status')
  checkTransactionStatus(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.statusCheck(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * check pan card status
   */
  //-------------------------------------------------------------------------

  @Post('/pancard-status')
  checkPanCardStatus(@Res() res: any, @Req() req: any) {
    return this.DigitalPanServices.statusCheck(res, req);
  }
}
