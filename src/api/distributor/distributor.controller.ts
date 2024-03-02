import { DistributorService } from "./distributor.service";
import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  Body,
  Put,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ChangeStatusDto, CreateUserDto } from "../user/dto/create-user.dto";
import { DocumentMiddleware } from "src/middleware/image.middleware";

@Controller("distributor")
export class DistributorController {
  constructor(private readonly distributorService: DistributorService) {}

  //-------------------------------------------------------------------------
  /***
   * create new distributor
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  register(
    @Body() createUserDto: CreateUserDto,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.distributorService.register(createUserDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * Distrubutor login
   */
  //-------------------------------------------------------------------------

  @Post("/login")
  distributorLogin(@Req() req: any, @Res() res: any) {
    return this.distributorService.distributorLogin(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * distributor profile
   */
  //-------------------------------------------------------------------------

  @Get("/profile")
  userProfile(@Res() res: any, @Req() req: any) {
    return this.distributorService.user_profile(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all distributor
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findAll(@Query() search: any, @Res() res: any, @Req() req: any) {
    return this.distributorService.list(search, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.distributorService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get retailer count
   */
  //-------------------------------------------------------------------------

  @Get("/get-retailer-count")
  getRetailerCount(@Req() req: any, @Res() res: any) {
    return this.distributorService.getRetailerCount(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/retailers/list")
  RetailersList(@Req() req: any, @Res() res: any) {
    return this.distributorService.RetailersList(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find distributor
   */
  //-------------------------------------------------------------------------

  @Get("/admin/view")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.distributorService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update status of distributor
   */
  //-------------------------------------------------------------------------

  @Put("/update-status")
  @UseInterceptors(DocumentMiddleware)
  updateStatus(
    @Query("id") id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Res() res: any,
    @Req() req: any,
    file: Express.Multer.File
  ) {
    return this.distributorService.updateStatus(
      id,
      changeStatusDto,
      res,
      req,
      file
    );
  }

  //-------------------------------------------------------------------------
  /***
   * block distributor
   */
  //-------------------------------------------------------------------------

  @Put("/block-user")
  blockUser(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.distributorService.blockUser(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * distributor email or mobile verified otp token verify
   */
  //-------------------------------------------------------------------------

  @Post("/otp-verify")
  verifiedOTPtoken(@Req() req: any, @Res() res: any) {
    return this.distributorService.verifyOtp(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * change password
   */
  //-------------------------------------------------------------------------

  @Post("/change-password")
  changePassword(@Req() req: any, @Res() res: any) {
    return this.distributorService.changePassword(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * filter pagination for distributor subscription
   */
  //-------------------------------------------------------------------------

  @Post("/admin/subscriptions")
  filterForCheckSubscription(@Req() req: any, @Res() res: any) {
    return this.distributorService.filterForCheckSubscription(req, res);
  }
}
