import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class ContactInfo {
  @Prop({ required: true, trim: true })
  contactPerson: string;

  @Prop({ required: true, trim: true })
  panNumber: string;

  @Prop({ required: true, trim: true })
  registrationNumber: string;

  @Prop({ required: true, trim: true })
  marqueeTag: string;

  @Prop({ required: true, trim: true })
  customerCareNo1: string;

  @Prop({ required: true, trim: true })
  customerCareNo2: string;

  @Prop({ required: true, trim: true })
  customerCareNo3: string;

  @Prop({ required: true, trim: true })
  customerCareNo4: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  mapLink: string;

  @Prop({ required: true, trim: true })
  loginPageContactNumber: string;

  @Prop({ required: true, trim: true })
  loginPageWhatsappNumber: string;

  @Prop({ required: true, trim: true })
  loginPageEmailId: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type ContactInfoDocument = ContactInfo & Document;
export const ContactInfoSchema = SchemaFactory.createForClass(ContactInfo);
