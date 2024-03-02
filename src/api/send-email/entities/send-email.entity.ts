import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class SendEmail {
  @Prop({ default: '' })
  cc: string;

  @Prop({ default: '' })
  bcc: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  emailBody: string;
}

export type SendEmailDocument = SendEmail & Document;
export const SendEmailSchema = SchemaFactory.createForClass(SendEmail);
