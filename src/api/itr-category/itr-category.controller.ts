import { UpdateItrCategoryDto } from './dto/update-itr-category.dto';
import { CreateItrCategoryDto } from './dto/create-itr-category.dto';
import { ItrCategoryServices } from './itr-category.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';

@Controller('itr-category')
export class ItrCategoryController {
  constructor(private readonly ItrCategoryService: ItrCategoryServices) {}

  //-------------------------------------------------------------------------
  /***
   * create new
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body()
    createItrCategoryDto: CreateItrCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.ItrCategoryService.add(createItrCategoryDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.ItrCategoryService.list(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find all for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.ItrCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateItrCategoryDto: UpdateItrCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.ItrCategoryService.update_by_id(
      id,
      updateItrCategoryDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.ItrCategoryService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status  show for guest
   */
  //-------------------------------------------------------------------------

  @Put('/change-status/show-for-guest')
  changeShowForGuest(
    @Query('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.ItrCategoryService.changeShowForGuest(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status  applicable-for-minor
   */
  //-------------------------------------------------------------------------

  @Put('/change-status/applicable-for-minor')
  changeapplicableForMinorStatus(
    @Query('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.ItrCategoryService.changeapplicableForMinorStatus(id, res, req);
  }
}
