import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum RequestStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  REJECT = 'REJECT',
}

@Schema({ timestamps: true })
export class RefundRequest {
  @Prop({ required: true })
  refundRequestedAmount: number;

  @Prop({ default: 0 })
  refundedAmount: number;

  @Prop({ required: true })
  accountHolderName: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  ifscCode: string;

  // @Prop({ required: true })
  // transactionNumber: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ default: RequestStatus.PENDING, enum: RequestStatus })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @Prop({ default: '' })
  rejectedById: string;

  @Prop({ default: '' })
  rejectedByName: string;

  @Prop({ default: '' })
  rejectedOnDate: string;

  @Prop({ default: '' })
  completedById: string;

  @Prop({ default: '' })
  completedByName: string;

  @Prop({ default: '' })
  completedOnDate: string;

  @Prop({ default: '' })
  appliedOnDate: string;

  @Prop({ default: '' })
  appliedByType: string;

  @Prop({ default: '' })
  appliedById: string;

  @Prop({ default: '' })
  transactionId: string;

  @Prop({ default: '' })
  remark: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type RefundRequestDocument = RefundRequest & Document;
export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);
