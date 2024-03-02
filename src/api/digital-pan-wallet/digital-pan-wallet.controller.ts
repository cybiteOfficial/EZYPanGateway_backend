import { DigitalPanWalletServices } from './digital-pan-wallet.service';
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

@Controller('balance')
export class DigitalPanWalletController {
  constructor(
    private readonly DigitalPanWalletServices: DigitalPanWalletServices,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * get wallet balance of user
   */
  //-------------------------------------------------------------------------

  @Post('/currentwallet')
  getWalletBallence(@Res() res: any, @Req() req: any) {
    return this.DigitalPanWalletServices.getWalletBalance(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * recharge wallet
   */
  //-------------------------------------------------------------------------

  @Post('/recharge-wallet')
  rechargeWallet(@Res() res: any, @Req() req: any) {
    return this.DigitalPanWalletServices.rechargeWallet(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Get('/get-wallet')
  findOne(@Query('/get-wallet') id: string, @Res() res: any, @Req() req: any) {
    return this.DigitalPanWalletServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Post('/web/get-wallet-transaction')
  listWeb(@Req() req: any, @Res() res: any) {
    return this.DigitalPanWalletServices.allWithFilters(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.DigitalPanWalletServices.allWithFilters(req, res);
  }
}
