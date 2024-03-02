import { Controller, Get, Res, Req, Post } from "@nestjs/common";
import { monthExcelSheetService } from "./monthly-excel-sheet.service";

@Controller("send-attachment")
export class monthlyExcelSheetController {
  constructor(
    private readonly monthExcelSheetService: monthExcelSheetService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * send monthly attachment
   */
  //-------------------------------------------------------------------------

  @Get("/monthly-commission")
  sendExcelSheet(@Res() res: any, @Req() req: any) {
    return this.monthExcelSheetService.sendExcelSheet(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * send monthly attachment
   */
  //-------------------------------------------------------------------------

  @Get("/user-commission")
  sendUserCommissionSheet(@Res() res: any, @Req() req: any) {
    return this.monthExcelSheetService.sendUserCommissionSheet(res, req);
  }
}
