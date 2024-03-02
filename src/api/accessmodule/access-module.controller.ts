/* eslint-disable prettier/prettier */
import { AccessModuleService } from './access-module.service';
import { UpdateAccessModuleDto } from './dto/update-access-module.dto';
import { CreateAccessModuleDto } from './dto/create-access-module.dto';

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

@Controller('access-modules')
export class AccessModuleController {
  constructor(private readonly AccessModuleService: AccessModuleService) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() CreateAccessModuleDto: CreateAccessModuleDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.AccessModuleService.add(CreateAccessModuleDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(@Res() res: any, @Req() req: any) {
    return this.AccessModuleService.update_by_id(res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Get('/get-access-modules')
  filter(@Req() req: any, @Res() res: any) {
    return this.AccessModuleService.getAccessModules(req, res);
  }
}
