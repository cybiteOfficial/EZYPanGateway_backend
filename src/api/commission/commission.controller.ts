import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Delete,
  Req,
  Res,
} from "@nestjs/common";
import { CommissionService } from "./commission.service";

@Controller("commission")
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  //-------------------------------------------------------------------------
  /***
   * create new faq
   */
  //-------------------------------------------------------------------------

  @Post("/add")
  register(@Res() res: any, @Req() req: any) {
    return this.commissionService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all faqs
   */
  //-------------------------------------------------------------------------

  @Get("/web/without-pagination")
  findAll(@Res() res: any, @Req() req: any) {
    return this.commissionService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all faqs
   */
  //-------------------------------------------------------------------------

  @Get("/admin/get-all")
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.commissionService.list(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find all categories
   */
  //-------------------------------------------------------------------------

  @Post("/admin/get-categories")
  findAllCategoriesForAdmin(@Res() res: any, @Req() req: any) {
    return this.commissionService.categoriesList(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find faq
   */
  //-------------------------------------------------------------------------

  @Get("/view")
  findOne(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.commissionService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find faq
   */
  //-------------------------------------------------------------------------

  @Get("/admin/view")
  findOneForAdmin(
    @Query("commissionName") commissionName: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.commissionService.view(commissionName, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update faq
   */
  //-------------------------------------------------------------------------

  @Put("/update")
  update(
    @Query("commissionName") commissionName: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.commissionService.update_by_id(commissionName, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * update faq
   */
  //-------------------------------------------------------------------------

  @Put("/update-categories")
  updateCategories(
    @Query("commissionName") commissionName: string,
    @Res() res: any,
    @Req() req: any
  ) {
    return this.commissionService.update_categories_by_id(
      commissionName,
      res,
      req
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove faq
   */
  //-------------------------------------------------------------------------

  @Delete("/delete")
  remove(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.commissionService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of faq
   */
  //-------------------------------------------------------------------------

  @Put("/change-status")
  changeStatus(@Query("id") id: string, @Res() res: any, @Req() req: any) {
    return this.commissionService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post("/list/pagination")
  filter(@Req() req: any, @Res() res: any) {
    return this.commissionService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * updated commission history
   */
  //-------------------------------------------------------------------------

  @Post("/updated-history")
  updatedHistory(@Req() req: any, @Res() res: any) {
    return this.commissionService.updatedHistory(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * add transaction
   */
  //-------------------------------------------------------------------------

  @Post("/history/add")
  addCommision(@Req() req: any, @Res() res: any) {
    return this.commissionService.addCommision(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Put("/history/update")
  updateCommisssioni(
    @Query("id") id: string,
    @Req() req: any,
    @Res() res: any
  ) {
    return this.commissionService.updateHistory(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * update transaction
   */
  //-------------------------------------------------------------------------

  @Get("/history/view")
  viewAdmin(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.commissionService.viewAdmin(id, req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * delete transaction
   */
  //-------------------------------------------------------------------------

  @Delete("/history/delete")
  delete(@Query("id") id: string, @Req() req: any, @Res() res: any) {
    return this.commissionService.delete(id, req, res);
  }
}
