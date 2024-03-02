import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class WhatsappTemplate {
  @Prop({ required: true })
  templateName: string;
  @Prop({ required: true })
  templateType: string;

  @Prop({ required: true })
  templateData: string;

  @Prop({ required: true })
  msgFrom: string;

  @Prop({ required: true })
  vars: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type WhatsappTemplateDocument = WhatsappTemplate & Document;
export const WhatsappTemplateSchema =
  SchemaFactory.createForClass(WhatsappTemplate);
