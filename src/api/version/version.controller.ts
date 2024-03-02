import { Controller, Get, Res, Req } from '@nestjs/common';
import { VersionService } from './version.service';

@Controller('version')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  //-------------------------------------------------------------------------
  /***
   * find all Versions
   */
  //-------------------------------------------------------------------------

  @Get('/list')
  findAll(@Res() res: any, @Req() req: any) {
    return this.versionService.list(res, req);
  }
}
