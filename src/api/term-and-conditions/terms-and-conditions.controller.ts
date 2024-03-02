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
} from '@nestjs/common';

import { TermsAndConditionsService } from './terms-and-conditions.service';

@Controller('terms-and-conditions')
export class TermsAndConditionsController {
  constructor(
    private readonly TermsAndConditionsService: TermsAndConditionsService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all TermsAndConditionss
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.TermsAndConditionsService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all TermsAndConditionss
   */
  //-------------------------------------------------------------------------

  @Get('/web/get-all')
  findAllForWeb(@Res() res: any, @Req() req: any) {
    return this.TermsAndConditionsService.listForWeb(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update TermsAndConditions
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.TermsAndConditionsService.update_by_id(id, res, req);
  }
}
