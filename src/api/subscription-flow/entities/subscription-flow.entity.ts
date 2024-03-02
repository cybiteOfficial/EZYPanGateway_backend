import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum SubscriptionType
{
  BLANK = '',
  ANNUAL = 'ANNUAL',
  LIFETIME = 'LIFETIME',
  // FREE = 'FREE',
}

@Schema( { timestamps: true } )
export class SubscriptionFlow
{
  @Prop( { required: true } )
  userId: string;

  @Prop( { required: true } )
  uniqueTransactionId: string;

  @Prop( { required: true } )
  amount: number;

  @Prop( { required: true, enum: SubscriptionType } )
  @IsEnum( SubscriptionType )
  subscriptionType: SubscriptionType;

  @Prop( { default: '' } )
  subscriptionExpiry: string;

  @Prop( { default: false } )
  isDeleted: boolean;

  @Prop( { default: true } )
  isActive: boolean;
}

export type SubscriptionFlowDocument = SubscriptionFlow & Document;
export const SubscriptionFlowSchema =
  SchemaFactory.createForClass( SubscriptionFlow );
