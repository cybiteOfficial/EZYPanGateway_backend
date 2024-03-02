import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
} from '@nestjs/common';
import { InitialNameService } from './initial-name.service';
import { CreateInitialNameDto } from './dto/create-initial-name.dto';
import { UpdateInitialNameDto } from './dto/update-initial-name.dto';

@Controller('initial-name')
export class InitialNameController {
  constructor(private readonly initialNameService: InitialNameService) {}

  @Get('get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.initialNameService.list(res, req);
  }
}
