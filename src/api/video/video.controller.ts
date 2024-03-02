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

import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  //-------------------------------------------------------------------------
  /***
   * create new Video
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createVideoDto: CreateVideoDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.videoService.add(createVideoDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all Videos
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.videoService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Video
   */
  //-------------------------------------------------------------------------

  @Get('/:id')
  findOne(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    return this.videoService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find Video
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.videoService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update Video
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.videoService.update_by_id(id, updateVideoDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * remove Video
   */
  //-------------------------------------------------------------------------

  @Delete('/delete')
  remove(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.videoService.delete_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * change status of Video
   */
  //-------------------------------------------------------------------------

  @Put('/change-status')
  changeStatus(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.videoService.changeActiveStatus(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination for admin
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.videoService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * change show on mobile of Banner
   */
  //-------------------------------------------------------------------------

  @Put('/change-showonmobile')
  changeShowOnMobile(
    @Query('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.videoService.changeShowOnMobile(id, res, req);
  }
}
