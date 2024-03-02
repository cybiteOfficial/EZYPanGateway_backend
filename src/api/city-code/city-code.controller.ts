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

import { CityCodeService } from './city-code.service';
import { CreateCityCodeDto } from './dto/create-city-code.dto';
import { UpdateCityCodeDto } from './dto/update-city-code.dto';

@Controller('city-code')
export class CityCodeController {
  constructor(private readonly CityCodeService: CityCodeService) {}

  //-------------------------------------------------------------------------
  /***
   * create new city-code
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() CreateCityCodeDto: CreateCityCodeDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.CityCodeService.add(CreateCityCodeDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all city-codes
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.CityCodeService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find city-code
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.CityCodeService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update city-code
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() UpdateCityCodeDto: UpdateCityCodeDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.CityCodeService.update_by_id(id, UpdateCityCodeDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.CityCodeService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * delete city codes
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.CityCodeService.delete_by_id(id, res, req);
  }
}
