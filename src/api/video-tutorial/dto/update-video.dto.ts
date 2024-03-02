import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoTutorialDto } from './create-video.dto';

export class UpdateVideoTutorialDto extends PartialType(
  CreateVideoTutorialDto,
) {}
