/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateFileUploadDto } from './create-file-upload.dto';

export class UpdateFileUploadDto extends PartialType(CreateFileUploadDto) {}
