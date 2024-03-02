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

import { VideoTutorialTutorialService } from './video-tutorial.service';
import { CreateVideoTutorialDto } from './dto/create-video.dto';
import { UpdateVideoTutorialDto } from './dto/update-video.dto';

@Controller('video-tutorial')
export class VideoTutorialController {
  constructor(
    private readonly VideoTutorialTutorialService: VideoTutorialTutorialService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new Video
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() CreateVideoTutorialDto: CreateVideoTutorialDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.VideoTutorialTutorialService.add(
      CreateVideoTutorialDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * find all Videos
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.VideoTutorialTutorialService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Video
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.VideoTutorialTutorialService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Video
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.VideoTutorialTutorialService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update Video
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() UpdateVideoTutorialDto: UpdateVideoTutorialDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.VideoTutorialTutorialService.update_by_id(
      id,
      UpdateVideoTutorialDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * remove Video
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.VideoTutorialTutorialService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Video
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.VideoTutorialTutorialService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.VideoTutorialTutorialService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * change show on mobile status of Video
   */
  //-------------------------------------------------------------------------

  @Put('/show-on-mobile')
  changeStatusShowOnMobile(
    @Query('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.VideoTutorialTutorialService.changeStatusShowOnMobile(
      id,
      res,
      req,
    );
  }
}
