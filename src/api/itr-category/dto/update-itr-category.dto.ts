import { PartialType } from '@nestjs/mapped-types';
import { CreateItrCategoryDto } from './create-itr-category.dto';

export class UpdateItrCategoryDto extends PartialType(CreateItrCategoryDto) {}
