import { GumastaStateConfigService } from "./gumasta-state-config.service";
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
  UseGuards,
} from "@nestjs/common";

import { ImageMiddleware } from "../../middleware/image.middleware";
import { Query, UseInterceptors } from "@nestjs/common/decorators";
import { UploadedFile } from "@nestjs/common/decorators";
import { VerifyToken } from "../../auth/auth.service";

@Controller("gumasta-state-config")
export class GumastaStateConfigController {
  constructor(
    private readonly gumastaStateConfigService: GumastaStateConfigService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new Gallery
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  register(@Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * view gumasta
   */
  //-------------------------------------------------------------------------

  @Get("/admin/view")
  getOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for users
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findAll(@Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for users
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-all")
  findAllAdmin(@Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove Gallery
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  @Put("/change-status")
  changeStatus(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaStateConfigService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.gumastaStateConfigService.allWithFilters(req, res);
  }
}
