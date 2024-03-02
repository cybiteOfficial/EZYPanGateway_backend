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

import { BusinessEnquiryService } from './business-enquiry.service';

@Controller('business-enquiry')
export class BusinessEnquiryController {
  constructor(
    private readonly BusinessEnquiryService: BusinessEnquiryService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   *add business enquiry
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.BusinessEnquiryService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.BusinessEnquiryService.allWithFilters(req, res);
  }
}
