import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class BusinessEnquiry {
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

export type BusinessEnquiryDocument = BusinessEnquiry & Document;
export const BusinessEnquirySchema =
  SchemaFactory.createForClass(BusinessEnquiry);
