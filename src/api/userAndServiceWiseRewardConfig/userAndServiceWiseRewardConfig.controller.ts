import { Controller, Put, Res, Req, Query, Get, Post } from '@nestjs/common';
import { RewardService } from './userAndServiceWiseRewardConfig.service';

@Controller('reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  //-------------------------------------------------------------------------
  /***
   * create new Reward
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.rewardService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update reward point
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('serviceName') serviceName: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.rewardService.update_by_id(serviceName, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find reward with servicename for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOne(
    @Query('serviceName') serviceName: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.rewardService.view(serviceName, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  getAll(@Res() res: any, @Req() req: any) {
    return this.rewardService.getAll(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point with pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Res() res: any, @Req() req: any) {
    return this.rewardService.allWithFilter(res, req);
  }
}
