import { AdminRoleService } from './adminrole.service';
import { UpdateAdminRoleDto } from './dto/update-admin.dto';
import { CreateAdminRoleDto } from './dto/create-admin.dto';

import {
  Controller,
  Post,
  Body,
  Put,
  Req,
  Res,
  Get,
  Query,
} from '@nestjs/common';

@Controller('admin-roles')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createAdminRoleDto: CreateAdminRoleDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.adminRoleService.add(createAdminRoleDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateAdminRoleDto: UpdateAdminRoleDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.adminRoleService.update_by_id(id, updateAdminRoleDto, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.adminRoleService.allWithFilters(req, res);
  }

  // //-------------------------------------------------------------------------
  // /***
  //  *get -role name
  //  */
  // //-------------------------------------------------------------------------

  @Get('/get-role-name')
  getRoleName(@Req() req: any, @Res() res: any) {
    return this.adminRoleService.getRoleName(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.adminRoleService.view(id, res, req);
  }
}
