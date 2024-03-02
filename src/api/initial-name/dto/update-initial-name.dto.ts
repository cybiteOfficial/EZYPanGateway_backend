import { PartialType } from '@nestjs/mapped-types';
import { CreateInitialNameDto } from './create-initial-name.dto';

export class UpdateInitialNameDto extends PartialType(CreateInitialNameDto) {}
