import { PartialType } from '@nestjs/mapped-types';
import { CreatePopupBannerDto } from './create-popup-banner.dto';

export class UpdatePopupBannerDto extends PartialType(CreatePopupBannerDto) {}
