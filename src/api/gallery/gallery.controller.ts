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
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { ImageMiddleware } from '../../middleware/image.middleware';
import { Query, UseInterceptors } from '@nestjs/common/decorators';
import { UploadedFile } from '@nestjs/common/decorators';
import { VerifyToken } from '../../auth/auth.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  //-------------------------------------------------------------------------
  /***
   * create new Gallery
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  @UseGuards(VerifyToken)
  @UseInterceptors(ImageMiddleware)
  register(
    @Body() createGalleryDto: CreateGalleryDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.galleryService.add(createGalleryDto, file, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for users
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.galleryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/getallwithcategories')
  listWithCategoriesForAdmin(
    @Query('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.galleryService.getAllCategoryWise(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Gallery category wise
   */
  //-------------------------------------------------------------------------

  @Get('/get-allcategorywise/')
  findAllByCategory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.galleryService.findAllGroupByCategoryinHeaders(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update Gallery
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  @UseInterceptors(ImageMiddleware)
  update(
    @Query('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.galleryService.update_by_id(
      id,
      updateGalleryDto,
      file,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove Gallery
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.galleryService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.galleryService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.galleryService.allWithFilters(req, res);
  }
}
