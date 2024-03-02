import { Controller, Get, Res, Req } from '@nestjs/common';
import { PendingAppService } from './pending-app.service';

@Controller('pending-app')
export class PendingAppController {
  constructor(private readonly pendingAppService: PendingAppService) {}

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.pendingAppService.list(res, req);
  }
}
