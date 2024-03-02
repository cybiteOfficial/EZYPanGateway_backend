import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class SmsTemplate {
  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true })
  templateName: string;

  @Prop({ required: true })
  template: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type SmsTemplateDocument = SmsTemplate & Document;
export const SmsTemplateSchema = SchemaFactory.createForClass(SmsTemplate);
