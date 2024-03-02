import { Controller, Get, Post } from "@nestjs/common";
import { Query, Req, Res } from "@nestjs/common/decorators";
import { TransactionService } from "./transaction.service";

@Controller("transaction")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  //-------------------------------------------------------------------------
  /***
   * view transactions
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.transactionService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * view transactions
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  allWithFilters(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.transactionService.allWithFilters(res, req);
  }

  @Post("/verify-payment")
  verifyPayment(@Req() req: any, @Res() res: any) {
    return this.transactionService.verifyPayment(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   crete webhook api religare
   */
  //-------------------------------------------------------------------------

  @Post("/webpage")
  digitalPanTransaction(@Req() req: any, @Res() res: any) {
    return this.transactionService.DigitalPanResponse(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   crete webhook api religare
   */
  //-------------------------------------------------------------------------

  @Post("/order-payment-status")
  verifyOrderPayment(@Req() req: any, @Res() res: any) {
    return this.transactionService.orderPaymentStatus(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   get application type with oreder id
   */
  //-------------------------------------------------------------------------

  @Post("/get-application-type")
  getApplicationTypeAgainstOrderId(@Req() req: any, @Res() res: any) {
    return this.transactionService.getApplicationTypeAgainstOrderId(req, res);
  }
  //-------------------------------------------------------------------------
  /***
updateStatus of applications  for app 
   */
  //-------------------------------------------------------------------------

  @Post("/update-status")
  updateStatusForApp(@Req() req: any, @Res() res: any) {
    return this.transactionService.statusUpdateForApp(req, res);
  }
}
