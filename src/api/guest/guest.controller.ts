import { GuestService } from './guest.service';
import {
  Controller,
  Post,
  Req,
  Res,
  Query,
  Get,
  Put,
  Body,
} from '@nestjs/common';
import { ApplyForDistributorDto } from './dto/apply-for-distributor.dto';

@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  //-------------------------------------------------------------------------
  /***
   * Guest login
   */
  //-------------------------------------------------------------------------

  @Post('/login')
  GuestLogin(@Req() req: any, @Res() res: any) {
    return this.guestService.guestLogin(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * Guest login
   */
  //-------------------------------------------------------------------------

  @Post('/apply-for-distributor')
  ApplyFoDistributor(@Req() req: any, @Res() res: any) {
    return this.guestService.applyFoDistributor(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * Verify otp
   */
  //-------------------------------------------------------------------------

  @Post('/token-verify')
  verifyOtpToken(@Req() req: any, @Res() res: any) {
    return this.guestService.verifyOtp(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.guestService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find guest
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.guestService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find guest
   */
  //-------------------------------------------------------------------------

  @Get('/guest-profile')
  user_profile(@Res() res: any, @Req() req: any) {
    return this.guestService.user_profile(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all distributor
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Query() search: any, @Res() res: any, @Req() req: any) {
    return this.guestService.list(search, res, req);
  }

  // //-------------------------------------------------------------------------
  // /***
  //  * update status of application
  //  */
  // //-------------------------------------------------------------------------

  // @Put('/update-status')
  // updateStatus(@Query('id') id: string, @Res() res: any) {
  //   return this.guestService.updateStatus(id, res);
  // }
  //-------------------------------------------------------------------------

  /***
   * block retailer
   */
  //-------------------------------------------------------------------------

  @Put('/block-user')
  blockUser(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.guestService.blockUser(id, res, req);
  }
}
