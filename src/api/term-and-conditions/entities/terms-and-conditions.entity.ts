import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class TermsAndConditions {
  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type TermsAndConditionsDocument = TermsAndConditions & Document;
export const TermsAndConditionsSchema =
  SchemaFactory.createForClass(TermsAndConditions);
