import { Controller, Put, Res, Req, Query, Get, Post } from '@nestjs/common';
import { RetailerRegisterRewardService } from './retailer-register-reward.service';

@Controller('retailer-register-reward')
export class RetailerRegisterRewardController {
  constructor(
    private readonly retailerRegisterRewardService: RetailerRegisterRewardService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new RetailerRegisterReward
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.retailerRegisterRewardService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update reward point
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.retailerRegisterRewardService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  getAll(@Res() res: any, @Req() req: any) {
    return this.retailerRegisterRewardService.getAll(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point with pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Res() res: any, @Req() req: any) {
    return this.retailerRegisterRewardService.allWithFilter(res, req);
  }
}
