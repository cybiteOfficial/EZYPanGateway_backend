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
import { RefundWalletTransactionService } from "./refund-wallet-transaction.service";

@Controller("refund-wallet-transaction")
export class RefundWalletTransactionController {
  constructor(
    private readonly RefundWalletTransactionService: RefundWalletTransactionService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * add transaction
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  add(@Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.add(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.update(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  viewAdmin(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.viewAdmin(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * delete transaction
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  delete(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.delete(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * find wallet
   */
  //-------------------------------------------------------------------------

  @Post("/web/get-wallet-transaction")
  listWeb(@Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.allWithFilters(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.RefundWalletTransactionService.allWithFilters(req, res);
  }
}
