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
} from '@nestjs/common';
import { BusinessOpportunityService } from './business-opportunity.service';

@Controller('business-opportunity')
export class BusinessOpportunityController {
  constructor(
    private readonly businessOpportunityService: BusinessOpportunityService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(
    @Res()
    res: any,
    @Req() req: any,
  ) {
    return this.businessOpportunityService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all BusinessOpportunitys
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  @Get('view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update BusinessOpportunity
   */
  //-------------------------------------------------------------------------
  @Put('/update')
  update(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.businessOpportunityService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.businessOpportunityService.allWithFilters(req, res);
  }
}
