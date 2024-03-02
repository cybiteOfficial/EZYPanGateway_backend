import { CreateAllAccessFieldsDto } from './create-all-access-fields.dto';

import { PartialType } from '@nestjs/mapped-types';

export class UpdateAllAccessFieldsDto extends PartialType(
  CreateAllAccessFieldsDto,
) {}
