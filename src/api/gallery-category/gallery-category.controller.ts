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

import { GalleryCategoryService } from './gallery-category.service';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';

@Controller('gallery-category')
export class GalleryCategoryController {
  constructor(
    private readonly galleryCategoryService: GalleryCategoryService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new GalleryCategory
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createGalleryCategoryDto: CreateGalleryCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.galleryCategoryService.add(createGalleryCategoryDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all GalleryCategorys
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.galleryCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all GalleryCategorys for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.galleryCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find GalleryCategory
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.galleryCategoryService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update GalleryCategory
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateGalleryCategoryDto: UpdateGalleryCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.galleryCategoryService.update_by_id(
      id,
      updateGalleryCategoryDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove GalleryCategory
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.galleryCategoryService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of GalleryCategory
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.galleryCategoryService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.galleryCategoryService.allWithFilters(req, res);
  }
}
