import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { transactionType } from "../../refund-wallet-transaction/entities/refund-wallet-transaction.entity";

export enum rewardFor {
  APPLICATIONAPPLIED = "APPLICATIONAPPLIED",
  APPLICATIONVERIFIED = "APPLICATIONVERIFIED",
  RETAILERADDED = "RETAILERADDED",
  MANUAL = "MANUAL",
}

export enum applicationType {
  BLANK = "",
  PAN = "PAN",
  DSC = "DSC",
  GUMASTA = "GUMASTA",
  ITR = "ITR",
  MSME = "MSME",
  DIGITAL_PAN = "DIGITAL_PAN",
}
@Schema({ timestamps: true })
export class RewardHistory {
  @Prop({ default: "" })
  userId: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  rewardPointValue: number;

  @Prop({ enum: applicationType, default: applicationType.BLANK })
  applicationType: applicationType;

  @Prop({ default: "" })
  applicationId: string;

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ default: "" })
  sjbtCode: string;

  @Prop({ default: "" })
  mobileNumber: string;

  @Prop({ default: "" })
  srn: string;

  @Prop({ default: "" })
  retailerId: string;

  @Prop({ enum: rewardFor, required: true })
  rewardFor: rewardFor;

  @Prop({ enum: transactionType, required: true })
  rewardTransactionType: transactionType;

  @Prop({ default: "" })
  logs: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({ default: false })
  isManual: boolean;
}

export type RewardHistoryDocument = RewardHistory & Document;
export const RewardHistorySchema = SchemaFactory.createForClass(RewardHistory);
