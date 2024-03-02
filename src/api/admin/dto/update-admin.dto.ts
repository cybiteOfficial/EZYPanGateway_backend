import { CreateAdminDto } from './create-admin.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
