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

import { FooterService } from './footer.service';
import { CreateFooterDto } from './dto/create-footer.dto';
import { UpdateFooterDto } from './dto/update-footer.dto';

@Controller('footer')
export class FooterController {
  constructor(private readonly footerService: FooterService) {}

  //-------------------------------------------------------------------------
  /***
   * create new Footer
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createFooterDto: CreateFooterDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.footerService.add(createFooterDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Footers
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.footerService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Footers
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.footerService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Footer
   */
  //-------------------------------------------------------------------------

  @Get('/view/admin')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update Footer
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateFooterDto: UpdateFooterDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.footerService.update_by_id(id, updateFooterDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove Footer
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Footer
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.footerService.changeActiveStatus(id, res, req);
  }
}
