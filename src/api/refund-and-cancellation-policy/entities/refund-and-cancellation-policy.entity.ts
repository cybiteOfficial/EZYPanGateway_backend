import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RefundAndCancellationPolicy {
  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RefundAndCancellationPolicyDocument = RefundAndCancellationPolicy &
  Document;
export const RefundAndCancellationPolicySchema = SchemaFactory.createForClass(
  RefundAndCancellationPolicy,
);
