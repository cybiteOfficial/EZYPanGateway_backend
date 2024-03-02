import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { PrivacyPolicyService } from './privacy-policy.service';

@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}

  //-------------------------------------------------------------------------
  /***
   * find all PrivacyPolicys
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.privacyPolicyService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all PrivacyPolicys
   */
  //-------------------------------------------------------------------------

  @Get('/web/get-all')
  findAllForWeb(@Res() res: any, @Req() req: any) {
    return this.privacyPolicyService.listForWeb(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update PrivacyPolicy
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.privacyPolicyService.update_by_id(id, res, req);
  }
}
