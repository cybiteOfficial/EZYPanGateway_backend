/* eslint-disable prettier/prettier */
import { AllAccessFieldsService } from './all-access-fields.service';
import { UpdateAllAccessFieldsDto } from './dto/update-all-access-fields.dto';
import { CreateAllAccessFieldsDto } from './dto/create-all-access-fields.dto';

import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Req,
  Res,
  Get,
} from '@nestjs/common';

@Controller('all-access-fields')
export class AllAccessFieldsController {
  constructor(
    private readonly AllAccessFieldsService: AllAccessFieldsService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Req() req: any, @Res() res: any) {
    return this.AllAccessFieldsService.add(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update/:id')
  update(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    return this.AllAccessFieldsService.update_by_id(id, req, res);
  }
  // //-------------------------------------------------------------------------
  // /***
  //  * with filter pagination
  //  */
  // //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.AllAccessFieldsService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * find all
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.AllAccessFieldsService.list(res, req);
  }
}
