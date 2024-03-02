import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  Delete,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { DocumentMiddleware } from "../../middleware/image.middleware";
import { PanCartServices } from "./pan-cart.service";

@Controller("pan-cart")
export class PanCartController {
  constructor(private readonly PanCartServices: PanCartServices) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  register(@Res() res: any, @Req() req: any) {
    return this.PanCartServices.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.PanCartServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * checkout
   */
  //-------------------------------------------------------------------------

  @Post("/checkout")
  checkout(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.PanCartServices.checkout(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * remove cart
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.PanCartServices.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *cart count
   */
  //-------------------------------------------------------------------------

  @Get("/item-count")
  cartCount(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.PanCartServices.cartCount(id, res, req);
  }
}
