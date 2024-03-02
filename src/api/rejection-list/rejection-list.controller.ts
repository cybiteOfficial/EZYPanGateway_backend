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

import { RejectionListService } from './rejection-list.service';
import { CreateRejectionListDto } from './dto/create-rejection-list.dto';
import { UpdateRejectionListDto } from './dto/update-rejection-list.dto';

@Controller('rejection-list')
export class RejectionListController {
  constructor(private readonly RejectionListService: RejectionListService) {}

  //-------------------------------------------------------------------------
  /***
   * create new RejectionList
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createRejectionListDto: CreateRejectionListDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.RejectionListService.add(createRejectionListDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all RejectionLists
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.RejectionListService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find RejectionList
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.RejectionListService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update RejectionList
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateRejectionListDto: UpdateRejectionListDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.RejectionListService.update_by_id(
      id,
      updateRejectionListDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove RejectionList
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.RejectionListService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of RejectionList
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.RejectionListService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.RejectionListService.allWithFilters(req, res);
  }
}
