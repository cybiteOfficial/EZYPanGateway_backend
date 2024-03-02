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
} from "@nestjs/common";
import { UserCommissionService } from "./user-commission.service";

@Controller("user-commission")
export class UserCommissionController {
  constructor(private readonly UserCommissionService: UserCommissionService) {}

  //-------------------------------------------------------------------------
  /***
   * total commission of login user
   */
  //-------------------------------------------------------------------------

  @Get("/total")
  findAll(@Res() res: any, @Req() req: any) {
    return this.UserCommissionService.userTotalCommission(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * total commission for admin
   */
  //-------------------------------------------------------------------------

  @Get("/admin/total")
  getTotalCommssionForAdmin(
    @Query("id") id: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.UserCommissionService.getTotalCommssionForAdmin(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all UserCommissions
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-all")
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.UserCommissionService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  UserCommission list for web
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.UserCommissionService.userCommissionList(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find UserCommission
   */
  //-------------------------------------------------------------------------

  @Get("/admin/view")
  findOneForAdmin(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.UserCommissionService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post("/admin/list/pagination")
  filter(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.UserCommissionService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * monthly commission for web
   */
  //-------------------------------------------------------------------------

  @Post("/history")
  mothlyCommission(@Req() req: any, @Res() res: any) {
    return this.UserCommissionService.monthlyCommission(req, res);
  }
}
