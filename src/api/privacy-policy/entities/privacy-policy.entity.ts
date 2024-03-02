import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class PrivacyPolicy {
  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type PrivacyPolicyDocument = PrivacyPolicy & Document;
export const PrivacyPolicySchema = SchemaFactory.createForClass(PrivacyPolicy);
