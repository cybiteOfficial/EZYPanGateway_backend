import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class ContactUsEnquiry {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type ContactUsEnquiryDocument = ContactUsEnquiry & Document;
export const ContactUsEnquirySchema =
  SchemaFactory.createForClass(ContactUsEnquiry);
