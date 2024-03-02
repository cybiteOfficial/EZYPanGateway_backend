import {
  Controller,
  Put,
  Res,
  Req,
  Query,
  Get,
  Post,
  Delete,
} from "@nestjs/common";
import { RewardPointService } from "./rewardValueConfig.service";

@Controller("reward-point")
export class RewardPointController {
  constructor(private readonly rewardPointService: RewardPointService) {}

  //-------------------------------------------------------------------------
  /***
   * create new RewardPoint
   */
  //-------------------------------------------------------------------------

  // @Post('/add')
  // add(@Res() res: any, @Req() req: any) {
  //   return this.rewardPointService.add(res, req);
  // }

  //-------------------------------------------------------------------------
  /***
   * update reward point
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.rewardPointService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  getAll(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.getAll(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall reward point with pagination
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.allWithFilter(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall user reward logs with pagination
   */
  //-------------------------------------------------------------------------

  @Post("/user-reward/pagination")
  filterUserReward(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.userRewardWithFilterForAdmin(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * getall user reward point of logged in user
   */
  //-------------------------------------------------------------------------

  @Get("/user-reward/get-all")
  userReward(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.userRewardList(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * total reward point of logged in user
   */
  //-------------------------------------------------------------------------

  @Get("/user-reward/total")
  userRewardTotal(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.userRewardTotalPoint(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * get reward wallet by admin
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-wallet")
  getUserWalletAdmin(
    @Query("id") id: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.rewardPointService.getUserWalletAdmin(id, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * update reward wallet by admin
   */
  //-------------------------------------------------------------------------

  @Put("/admin/update-wallet")
  updateUserWalletAdmin(
    @Query("id") id: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.rewardPointService.updateUserWalletAdmin(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * total reward amount of logged in user
   */
  //-------------------------------------------------------------------------

  @Get("/user-reward/total-value")
  userRewardTotalAmountForApplication(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.userRewardTotalAmountForApplication(
      res,
      req
    );
  }

  //-------------------------------------------------------------------------
  /***
   * user reward history
   */
  //-------------------------------------------------------------------------

  @Post("/history")
  userRewardHistory(@Res() res: any, @Req() req: any) {
    return this.rewardPointService.userRewardHistory(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * add transaction
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  add(@Req() req: any, @Res() res: any) {
    return this.rewardPointService.add(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Put("/history/update")
  updateTransaction(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.rewardPointService.update(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  viewAdmin(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.rewardPointService.viewAdmin(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * delete transaction
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  delete(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.rewardPointService.delete(id, req, res);
  }
}
