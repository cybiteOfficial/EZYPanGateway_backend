import { Controller, Post, Req, Res } from '@nestjs/common';
import { SubscriptionFlowService } from './subscription-flow.service';

@Controller('subscription-flow')
export class SubscriptionFlowController {
  constructor(
    private readonly subscriptionFlowService: SubscriptionFlowService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new SubscriptionFlow
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.subscriptionFlowService.add(res, req);
  }
}
