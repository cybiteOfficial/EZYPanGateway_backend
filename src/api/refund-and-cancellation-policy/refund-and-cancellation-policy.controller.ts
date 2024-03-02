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
import { RefundAndCancellationPolicyService } from './refund-and-cancellation-policy.service';

@Controller('refund-and-cancellation')
export class RefundAndCancellationPolicyController {
  constructor(
    private readonly refundAndCancellationPolicyService: RefundAndCancellationPolicyService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all RefundAndCancellationPolicys
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.refundAndCancellationPolicyService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all RefundAndCancellationPolicys
   */
  //-------------------------------------------------------------------------

  @Get('/web/get-all')
  findAllForWeb(@Res() res: any, @Req() req: any) {
    return this.refundAndCancellationPolicyService.listForWeb(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update RefundAndCancellationPolicy
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.refundAndCancellationPolicyService.update_by_id(id, res, req);
  }
}
