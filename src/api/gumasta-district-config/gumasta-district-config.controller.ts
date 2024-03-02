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

import { Query } from "@nestjs/common/decorators";

import { GumastaDistrictConfigService } from "./gumasta-district-config.service";

@Controller("gumasta-district-config")
export class GumastaDistrictConfigController {
  constructor(
    private readonly gumastaDistrictConfigService: GumastaDistrictConfigService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new Gallery
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  register(@Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for users
   */
  //-------------------------------------------------------------------------

  @Get("/get-all")
  findAll(@Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for users
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-all")
  findAllAdmin(@Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * view gumasta
   */
  //-------------------------------------------------------------------------

  @Get("/admin/view")
  getOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove Gallery
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  @Put("/change-status")
  changeStatus(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaDistrictConfigService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post("/admin/list/pagination")
  filterAdmin(@Req() req: any, @Res() res: any) {
    return this.gumastaDistrictConfigService.allWithFilters(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.gumastaDistrictConfigService.allWithFilters(req, res);
  }
}
