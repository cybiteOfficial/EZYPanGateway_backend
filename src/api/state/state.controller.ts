import { Controller, Get, Res, Req } from '@nestjs/common';
import { StateService } from './state.service';

@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  //-------------------------------------------------------------------------
  /***
   * find all States
   */
  //-------------------------------------------------------------------------

  @Get('/web/without-pagination')
  findAll(@Res() res: any, @Req() req: any) {
    return this.stateService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all States
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.stateService.list(res, req);
  }
}
