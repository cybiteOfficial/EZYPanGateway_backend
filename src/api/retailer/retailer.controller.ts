import {
  Controller,
  Post,
  Req,
  Res,
  Get,
  Param,
  Body,
  Put,
  Query,
} from '@nestjs/common';
import { RetailerService } from './retailer.service';

@Controller('retailer')
export class RetailerController {
  constructor(private readonly retailerService: RetailerService) {}

  //-------------------------------------------------------------------------
  /***
   * Login user
   */
  //-------------------------------------------------------------------------

  @Post('/login')
  login(@Req() req: any, @Res() res: any) {
    return this.retailerService.login(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * Verify otp
   */
  //-------------------------------------------------------------------------

  @Post('/otp-verify')
  verifyOtpToken(@Req() req: any, @Res() res: any) {
    return this.retailerService.verifyOtp(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * apply for distributor
   */
  //-------------------------------------------------------------------------

  @Post('/apply-for-distributor')
  applyForDistributor(@Res() res: any, @Req() req: any) {
    return this.retailerService.applyForDistributor(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * verify otp for email and mobile
   */
  //-------------------------------------------------------------------------

  @Post('/verify-otp')
  verifyOtpDistributor(@Res() res: any, @Req() req: any) {
    return this.retailerService.verifyOtpDistributor(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.retailerService.allWithFilters(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * retailer profile
   */
  //-------------------------------------------------------------------------

  @Get('/retailer-profile')
  user_profile(@Res() res: any, @Req() req: any) {
    return this.retailerService.user_profile(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find retailer
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.retailerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all distributor
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Query() search: any, @Res() res: any, @Req() req: any) {
    return this.retailerService.list(search, res, req);
  }

  // //-------------------------------------------------------------------------
  // /***
  //  * update status of application
  //  */
  // //-------------------------------------------------------------------------

  // @Put('/update-status/:id')
  // updateStatus(@Param('id') id: string, @Res() res: any) {
  //   return this.retailerService.updateStatus(id, res);
  // }

  //-------------------------------------------------------------------------
  /***
   * block retailer
   */
  //-------------------------------------------------------------------------

  @Put('/block-user')
  blockUser(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.retailerService.blockUser(id, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * retailer profile update
   */
  //------------------------------------------------------------------------
  // @Put('/update-profile')
  // update_by_id(@Query('id') id: string, @Res() res: any, @Req() req: any) {
  //   return this.retailerService.update_by_id(id, req, res);
  // }

  //-------------------------------------------------------------------------
  /***
   * update retailer
   */
  //-------------------------------------------------------------------------

  @Put('/update-profile')
  retailerUpdate(@Res() res: any, @Req() req: any) {
    return this.retailerService.retailerUpdate(res, req);
  }

  //-------------------------------------------------------------------------
}
