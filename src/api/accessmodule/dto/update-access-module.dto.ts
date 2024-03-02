import { CreateAccessModuleDto } from './create-access-module.dto';

import { PartialType } from '@nestjs/mapped-types';

export class UpdateAccessModuleDto extends PartialType(CreateAccessModuleDto) {}
