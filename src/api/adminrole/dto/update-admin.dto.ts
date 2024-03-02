import { CreateAdminRoleDto } from './create-admin.dto';

import { PartialType } from '@nestjs/mapped-types';

export class UpdateAdminRoleDto extends PartialType(CreateAdminRoleDto) {}
