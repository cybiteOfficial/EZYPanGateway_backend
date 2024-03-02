import { UpdatePanCategoryDto } from './dto/update-pan-category.dto';
import { CreatePanCategoryDto } from './dto/create-pan-category.dto';
import { PanCategoryServices } from './pan-category.service';
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
import { VerifyToken } from '../../auth/auth.service';
import { Request } from '@nestjs/common/decorators';

@Controller('pan-category')
export class PanCategoryController {
  constructor(private readonly panCategoryService: PanCategoryServices) {}

  //-------------------------------------------------------------------------
  /***
   * create new
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createPanCategoryDto: CreatePanCategoryDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.panCategoryService.add(createPanCategoryDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.panCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.panCategoryService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updatePanCategoryDto: UpdatePanCategoryDto,
    @Req() req: Request,
    @Res() res: any,
  ) {
    return this.panCategoryService.update_by_id(
      id,
      updatePanCategoryDto,
      req,
      res,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Footer
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.panCategoryService.changeActiveStatus(id, res, req);
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
    return this.panCategoryService.changeShowForGuest(id, res, req);
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
    return this.panCategoryService.changeapplicableForMinorStatus(id, res, req);
  }
}
