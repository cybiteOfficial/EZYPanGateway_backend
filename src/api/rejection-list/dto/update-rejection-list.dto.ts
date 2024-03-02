import { PartialType } from '@nestjs/mapped-types';
import { CreateRejectionListDto } from './create-rejection-list.dto';

export class UpdateRejectionListDto extends PartialType(
  CreateRejectionListDto,
) {}
