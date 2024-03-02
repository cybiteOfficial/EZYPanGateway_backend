import { PartialType } from '@nestjs/mapped-types';
import { CreateDigitalSignDto } from './create-digital-sign.dto';

export class UpdateDigitalSignDto extends PartialType(CreateDigitalSignDto) {}
