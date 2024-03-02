import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  Query,
} from "@nestjs/common";
import { Request, Response } from "express";
import { UserService } from "./user.service";
import { CreateUserDto, ChangeStatusDto } from "./dto/create-user.dto";
import { DocumentMiddleware } from "../../middleware/image.middleware";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findAll(@Res() res: any, @Req() req: any) {
    return this.userService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user
   */
  //-------------------------------------------------------------------------

  @Get("/view/admin/get-profile")
  findOne(@Query("id") id: string, @Res() res: Response, @Req() req: Request) {
    return this.userService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user
   */
  //-------------------------------------------------------------------------

  @Post("/get-category")
  getcategory(@Res() res: any, @Req() req: any) {
    return this.userService.getCategory(res, req);
  }

  /***
   * distributor email or mobile verified otp token verify
   */
  //-------------------------------------------------------------------------

  @Post("/resend-otp")
  resendOTP(@Req() req: any, @Res() res: any) {
    return this.userService.resendOTP(req, res);
  }
  //-------------------------------------------------------------------------
  //-------------------------------------------------------------------------

  /***
   * user refresh token
   */
  //-------------------------------------------------------------------------

  @Post("/refresh-token")
  refreshToken(@Req() req: any, @Res() res: any) {
    return this.userService.refreshToken(req, res);
  }

  //-------------------------------------------------------------------------
  //-------------------------------------------------------------------------

  /***
   * get Services
   */
  //-------------------------------------------------------------------------

  @Get("/get-services")
  getServices(@Res() res: any, @Req() req: any) {
    return this.userService.getServices(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put("/update-profile")
  update(@Query() id: any, @Res() res: any, @Req() req: any) {
    return this.userService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove user
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.userService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of user
   */
  //-------------------------------------------------------------------------

  @Put("/change-status")
  changeStatus(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.userService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/check-logs")
  filter(@Req() req: any, @Res() res: any) {
    return this.userService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update status of application
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
    return this.userService.updateStatus(id, changeStatusDto, res, req, file);
  }

  //-------------------------------------------------------------------------
  /***
   * update user category
   */
  //-------------------------------------------------------------------------

  @Put("/update/category")
  updateCategory(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.userService.updateCategory(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update user services
   */
  //-------------------------------------------------------------------------

  @Put("/update/services")
  updateServices(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.userService.updateServices(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * adhar check
   */
  //-------------------------------------------------------------------------

  @Post("/aadhar-check")
  Adharcheck(@Res() res: any, @Req() req: any) {
    return this.userService.Adharcheck(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * check fields exist
   */
  //-------------------------------------------------------------------------

  @Post("/check-fields-exist")
  CheckFieldsExist(@Res() res: any, @Req() req: any) {
    return this.userService.checkFieldsExist(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * cancel application
   */
  //-------------------------------------------------------------------------

  @Post("/cancel-application")
  cancelApp(@Res() res: any, @Req() req: any) {
    return this.userService.cancelApp(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * reset password
   */
  //-------------------------------------------------------------------------
  @Post("/reset-password")
  resetPassword(@Res() res: any, @Req() req: any) {
    return this.userService.resetPassword(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * forgot password
   */
  //-------------------------------------------------------------------------

  @Post("/forgot-password")
  forgotPassword(@Res() res: any, @Req() req: any) {
    return this.userService.forgotPassword(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * reupload pdf
   */
  //-------------------------------------------------------------------------

  @Post("/reupload-pdf")
  @UseInterceptors(DocumentMiddleware)
  reUploadPdf(
    @Query("id") id: string,
    @Res() res: any,
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File
  ) {
    return this.userService.reUploadPdf(id, res, req, file);
  }

  //-------------------------------------------------------------------------
  /***
   * user change password
   */
  //-------------------------------------------------------------------------

  @Post("/change-password")
  changePassword(@Res() res: any, @Req() req: any) {
    return this.userService.changePassword(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get declarationl form url for app and web
   */
  //-------------------------------------------------------------------------

  @Get("/declaration-form")
  getDeclarationFormUrl(@Res() res: any, @Req() req: any) {
    return this.userService.getDeclarationFormUrl(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * delete user api for app /privacy policy
   */
  //-------------------------------------------------------------------------

  @Delete("/delete-user")
  deleteUserForApp(
    @Query("token") token: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.userService.deleteUserAccount(req, res, token);
  }
}
