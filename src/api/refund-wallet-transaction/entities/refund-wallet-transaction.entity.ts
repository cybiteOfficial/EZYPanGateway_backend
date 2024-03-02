import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum } from "class-validator";
export enum transactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}
@Schema({ timestamps: true })
export class RefundWalletTransactions {
  @Prop({ default: "" })
  walletId: string;

  @Prop({ default: "" })
  userId: string;

  @Prop({ default: "" })
  applicationType: string;

  @Prop({ default: "" })
  applicationId: string;

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ default: "", enum: transactionType })
  @IsEnum(transactionType)
  transactionType: transactionType;

  @Prop({ default: 0 })
  debitedAmount: number;

  @Prop({ default: 0 })
  creditedAmount: number;

  @Prop({ default: "" })
  createdByType: string;

  @Prop({ default: "" })
  createdById: string;

  @Prop({ default: "" })
  paymentStatus: string;

  @Prop({ default: "" })
  dateAndTime: string;

  @Prop({ default: "" })
  remark: string;

  @Prop({ default: "" })
  transactionId: string;

  @Prop({ default: "" })
  uuid: string;
  @Prop({ default: "" })
  sjbtCode: string;
  @Prop({ default: "" })
  srn: string;
  @Prop({ default: false })
  isDeleted: false;

  @Prop({ default: true })
  isActive: true;

  @Prop({ default: false })
  isManual: false;
}

export type RefundWalletTransactionsDocument = RefundWalletTransactions &
  Document;
export const RefundWalletTransactionsSchema = SchemaFactory.createForClass(
  RefundWalletTransactions
);
