import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuLinkDto } from './create-menu-link.dto';

export class UpdateMenuLinkDto extends PartialType(CreateMenuLinkDto) {}
