import { PartialType } from '@nestjs/mapped-types';
import { CreateMsmeApplicationDto } from './create-msme-application.dto';

export class UpdateMsmeApplicationDto extends PartialType(CreateMsmeApplicationDto) {}
