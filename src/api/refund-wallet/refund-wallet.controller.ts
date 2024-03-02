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
  Query,
} from "@nestjs/common";
import { RefundWalletService } from "./refund-wallet.service";

@Controller("refund-wallet")
export class RefundWalletController {
  constructor(private readonly RefundWalletService: RefundWalletService) {}

  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Get("/get-wallet")
  findOne(@Query("userId") id: string, @Res() res: any, @Req() req: any) {
    return this.RefundWalletService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-wallet")
  findOneForAdmin(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.RefundWalletService.view(id, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Put("/admin/update-wallet")
  updateWalletByAdmin(
    @Query("userId") id: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.RefundWalletService.updateWalletByAdmin(id, res, req);
  }
}
