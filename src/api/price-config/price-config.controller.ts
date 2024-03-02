import { UpdatePriceConfigDto } from './dto/update-price-config.dto';
import { CreatePriceConfigDto } from './dto/create-price-config.dto';
import { PriceConfigService } from './price-config.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Req,
  Res,
  Query,
} from '@nestjs/common';

@Controller('price-config')
export class priceConfigController {
  constructor(private readonly priceConfigService: PriceConfigService) {}

  //-------------------------------------------------------------------------
  /***
   * find all base price
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.priceConfigService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find base price
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.priceConfigService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update base price
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updatePriceConfigDto: UpdatePriceConfigDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.priceConfigService.update_by_id(
      id,
      updatePriceConfigDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.priceConfigService.allWithFilters(req, res);
  }
}
