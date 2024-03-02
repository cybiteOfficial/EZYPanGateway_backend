import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { SubscriptionType } from '../../subscription-flow/entities/subscription-flow.entity';
export enum subscriptionCode {
  SJBTANNUAL = 'SJBTANNUAL',
  // SJBTFREE = 'SJBTFREE',
  SJBTLIFETIME = 'SJBTLIFETIME',
}

@Schema({ timestamps: true })
export class subscription {
  @Prop({ required: true, enum: SubscriptionType })
  @IsEnum(SubscriptionType)
  planName: SubscriptionType;

  @Prop({ required: true })
  durationIndays: number;

  @Prop({ default: '' })
  durationInWords: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: subscriptionCode })
  @IsEnum(subscriptionCode)
  subscriptionCode: subscriptionCode;

  @Prop({ type: Array, default: [] })
  logs: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type subscriptionDocument = subscription & Document;
export const subscriptionSchema = SchemaFactory.createForClass(subscription);
