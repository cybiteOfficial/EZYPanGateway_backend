import { PartialType } from '@nestjs/mapped-types';
import { CreateItrApplicationDto } from './create-itr-application.dto';

export class UpdateItrApplicationDto extends PartialType(
  CreateItrApplicationDto,
) {}
