import { SubscriptionServices } from './subscription-plan.service';
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
import { VerifyToken } from '../../auth/auth.service';
import { Request } from '@nestjs/common/decorators';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly SubscriptionServices: SubscriptionServices) {}

  //-------------------------------------------------------------------------
  /***
   * create new
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find subscription history of user
   */
  //-------------------------------------------------------------------------

  @Post('/history')
  findSubscription(@Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.findSubscriptionHistory(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update
   */
  //-------------------------------------------------------------------------

  @Put('/admin/update')
  update(@Query('id') id: string, @Req() req: Request, @Res() res: any) {
    return this.SubscriptionServices.update_by_id(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * findone
   */
  //-------------------------------------------------------------------------

  @Get('/view/admin')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * add subscription plan
   */
  //-------------------------------------------------------------------------

  @Post('/buy-subscription')
  subscription(@Res() res: any, @Req() req: any) {
    return this.SubscriptionServices.buySubscription(res, req);
  }
}
