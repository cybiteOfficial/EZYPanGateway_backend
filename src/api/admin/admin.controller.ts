import { UpdateAdminDto } from "./dto/update-admin.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { AdminService } from "./admin.service";
import {
  Controller,
  Post,
  Body,
  Put,
  Query,
  Req,
  Res,
  Get,
  Delete,
} from "@nestjs/common";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  add(@Res() res: any, @Req() req: any) {
    return this.adminService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.adminService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Post("/delete-zip")
  deleteZip(@Res() res: any, @Req() req: any) {
    return this.adminService.deleteZip(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.adminService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find user
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.adminService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove user
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.adminService.delete_by_id(id, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findAll(@Res() res: any, @Req() req: any) {
    return this.adminService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * admin login
   */
  //-------------------------------------------------------------------------

  @Post("/login")
  login(@Req() req: any, @Res() res: any) {
    return this.adminService.login(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * admin refresh token
   */
  //-------------------------------------------------------------------------

  @Post("/refresh-token")
  refreshToken(@Req() req: any, @Res() res: any) {
    return this.adminService.refreshToken(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * admin change password
   */
  //-------------------------------------------------------------------------

  @Post("/change-password")
  changePassword(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.adminService.changePassword(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * admin change password by Superadmin
   */
  //-------------------------------------------------------------------------

  @Post("/change-password-admin")
  changePasswordBySuperAdmin(
    @Query("id") id: string,
    @Req() req: any,
    @Res() res: any
  ) {
    return this.adminService.changePasswordBySuperAdmin(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * admin forgot password
   */
  //-------------------------------------------------------------------------

  @Post("/forgot-password")
  forgotPassword(@Req() req: any, @Res() res: any) {
    return this.adminService.forgotPassword(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination report of admin
   */
  //-------------------------------------------------------------------------

  @Post("/report-admin")
  reportForAdmin(@Req() req: any, @Res() res: any) {
    return this.adminService.reportForAdmin(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination report of distributor
   */
  //-------------------------------------------------------------------------

  @Post("/report-distributor")
  reportForDistributor(@Req() req: any, @Res() res: any) {
    return this.adminService.reportForDistributor(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination report of retailer
   */
  //-------------------------------------------------------------------------

  @Post("/report-retailer")
  reportForRetailer(@Req() req: any, @Res() res: any) {
    return this.adminService.reportForRetailer(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get role access list
   */
  //-------------------------------------------------------------------------

  @Get("/get-role-access-list")
  getRoleAccessList(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.adminService.getAccessList(res, req);
  }
}
