import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class EmailTemplate {
  @Prop({ required: true })
  templateName: string;

  @Prop({ required: true })
  templateSubject: string;

  @Prop({ required: true })
  templateData: string;

  @Prop({ required: true })
  emailFrom: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type EmailTemplateDocument = EmailTemplate & Document;
export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
