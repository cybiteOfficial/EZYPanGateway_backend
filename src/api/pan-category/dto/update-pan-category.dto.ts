import { CreatePanCategoryDto } from './create-pan-category.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePanCategoryDto extends PartialType(CreatePanCategoryDto) {}
