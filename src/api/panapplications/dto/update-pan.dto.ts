import { CreatePanAppDto } from './create-pan.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePanApplicationDto extends PartialType(CreatePanAppDto) {}
