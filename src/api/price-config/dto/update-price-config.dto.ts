import { CreatePriceConfigDto } from './create-price-config.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePriceConfigDto extends PartialType(CreatePriceConfigDto) {}
