import { PartialType } from '@nestjs/mapped-types';
import { CreateCityCodeDto } from './create-city-code.dto';

export class UpdateCityCodeDto extends PartialType(CreateCityCodeDto) {}
