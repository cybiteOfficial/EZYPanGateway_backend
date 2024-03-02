import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './entities/email-template.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class EmailTemplatesModule {}
