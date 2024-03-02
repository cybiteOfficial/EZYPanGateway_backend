import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { ContactInfoService } from './contact-info.service';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';

@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  //-------------------------------------------------------------------------
  /***
   * find all ContactInfos
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.contactInfoService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all ContactInfos
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.contactInfoService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find ContactInfo
   */
  //-------------------------------------------------------------------------

  @Get('/view/admin')
  findOneForAdmin(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.contactInfoService.view(id, req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update ContactInfo
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateContactInfoDto: UpdateContactInfoDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.contactInfoService.update_by_id(
      id,
      updateContactInfoDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove ContactInfo
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.contactInfoService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of ContactInfo
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.contactInfoService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.contactInfoService.allWithFilters(req, res);
  }
}
