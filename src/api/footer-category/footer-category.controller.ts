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
  Query,
} from '@nestjs/common';

import { FooterCategoryService } from './footer-category.service';
import { CreateFooterCategoryDto } from './dto/create-footer-category.dto';
import { UpdateFooterCategoryDto } from './dto/update-footer-category.dto';

@Controller('footer-category')
export class FooterCategoryController {
  constructor(private readonly footerCategoryService: FooterCategoryService) {}

  //-------------------------------------------------------------------------
  /***
   * create new FooterCategory
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createFooterCategoryDto: CreateFooterCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.footerCategoryService.add(createFooterCategoryDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all FooterCategorys
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.footerCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find FooterCategory
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerCategoryService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update FooterCategory
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateFooterCategoryDto: UpdateFooterCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.footerCategoryService.update_by_id(
      id,
      updateFooterCategoryDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove FooterCategory
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerCategoryService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of FooterCategory
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerCategoryService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.footerCategoryService.allWithFilters(req, res);
  }
}
