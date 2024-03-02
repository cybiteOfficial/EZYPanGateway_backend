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

import { MenuLinksService } from './menu-links.service';
import { CreateMenuLinkDto } from './dto/create-menu-link.dto';
import { UpdateMenuLinkDto } from './dto/update-menu-link.dto';

@Controller('menu-links')
export class MenuLinksController {
  constructor(private readonly menuLinksService: MenuLinksService) {}

  //-------------------------------------------------------------------------
  /***
   * create new MenuLinks
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createMenuLinksDto: CreateMenuLinkDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.menuLinksService.add(createMenuLinksDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all MenuLinkss
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.menuLinksService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all MenuLinkss
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.menuLinksService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find MenuLinks
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.menuLinksService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find MenuLinks
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.menuLinksService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update MenuLinks
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateMenuLinksDto: UpdateMenuLinkDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.menuLinksService.update_by_id(id, updateMenuLinksDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove MenuLinks
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.menuLinksService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of MenuLinks
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.menuLinksService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.menuLinksService.allWithFilters(req, res);
  }
}
