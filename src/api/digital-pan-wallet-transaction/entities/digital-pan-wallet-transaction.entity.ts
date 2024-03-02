import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
export enum transactionType {
  BLANK = '',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}
export enum DigitalPanCardType {
  BLANK = '',
  N = 'N',
  Y = 'Y',
}
@Schema({ timestamps: true })
export class DigitalPanTransactions {
  @Prop({ default: '' })
  walletId: string;

  @Prop({ default: '' })
  userId: string;

  @Prop({ default: '' })
  uniqueTransactionId: string;

  @Prop({ default: '', enum: transactionType })
  @IsEnum(transactionType)
  transactionType: transactionType;

  @Prop({ default: 0 })
  debitedAmount: number;

  @Prop({ default: 0 })
  creditedAmount: number;

  @Prop({ default: '' })
  createdByType: string;

  @Prop({ default: '' })
  createdById: string;

  @Prop({ default: '' })
  paymentStatus: string;

  @Prop({ default: '' })
  dateAndTime: string;

  @Prop({ default: '' })
  remark: string;

  @Prop({ default: false })
  isDeleted: false;

  @Prop({ default: true })
  isActive: true;
}

export type DigitalPanTransactionsDocument = DigitalPanTransactions & Document;
export const DigitalPanTransactionsSchema = SchemaFactory.createForClass(
  DigitalPanTransactions,
);
