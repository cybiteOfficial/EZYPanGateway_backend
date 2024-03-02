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
} from '@nestjs/common';

import { LoanEnquiryService } from './loan-enquiry.service';

@Controller('loan-enquiry')
export class LoanEnquiryController {
  constructor(private readonly LoanEnquiryService: LoanEnquiryService) {}

  //-------------------------------------------------------------------------
  /***
   * create new city-code
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all city-codes
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find city-code
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update city-code
   */
  //-------------------------------------------------------------------------

  @Put('/update/:id')
  update(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove city-code
   */
  //-------------------------------------------------------------------------

  @Delete('/delete/:id')
  remove(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of city-code
   */
  //-------------------------------------------------------------------------

  @Put('/change-status/:id')
  changeStatus(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.LoanEnquiryService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.LoanEnquiryService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * send email
   */
  //-------------------------------------------------------------------------
  @Post('/email')
  sendEmail(@Req() req: any, @Res() res: any) {
    return this.LoanEnquiryService.sendEmail(req, res);
  }
}
