import { PartialType } from '@nestjs/mapped-types';
import { CreateFooterCategoryDto } from './create-footer-category.dto';

export class UpdateFooterCategoryDto extends PartialType(
  CreateFooterCategoryDto,
) {}
