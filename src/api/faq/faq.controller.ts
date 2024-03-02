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

import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  //-------------------------------------------------------------------------
  /***
   * create new faq
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() CreateFaqDto: CreateFaqDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.faqService.add(CreateFaqDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all faqs
   */
  //-------------------------------------------------------------------------

  @Get('/web/without-pagination')
  findAll(@Res() res: any, @Req() req: any) {
    return this.faqService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all faqs
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.faqService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find faq
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.faqService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find faq
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.faqService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update faq
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() UpdateFaqDto: UpdateFaqDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.faqService.update_by_id(id, UpdateFaqDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove faq
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.faqService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of faq
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.faqService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.faqService.allWithFilters(req, res);
  }
}
