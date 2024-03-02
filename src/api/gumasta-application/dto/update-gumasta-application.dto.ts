import { PartialType } from '@nestjs/mapped-types';
import { CreateGumastaApplicationDto } from './create-gumasta-application.dto';

export class UpdateGumastaApplicationDto extends PartialType(
  CreateGumastaApplicationDto,
) {}
