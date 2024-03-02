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
import { ContactUsEnquiryService } from './contact-us-enquiry.service';

@Controller('contact-us-enquiry')
export class ContactUsEnquiryController {
  constructor(
    private readonly ContactUsEnquiryService: ContactUsEnquiryService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   *add business enquiry
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.ContactUsEnquiryService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.ContactUsEnquiryService.allWithFilters(req, res);
  }
}
