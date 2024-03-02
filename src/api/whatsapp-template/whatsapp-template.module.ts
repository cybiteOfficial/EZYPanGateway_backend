import {
  WhatsappTemplate,
  WhatsappTemplateSchema,
} from "./entities/whatsapp-template.entity";
import { Module } from "@nestjs/common";

import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsappTemplate.name, schema: WhatsappTemplateSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class WhatsappTemplateModule {}
