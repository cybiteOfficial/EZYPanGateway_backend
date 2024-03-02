import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { transactionType } from "../../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { Role } from "../../user/entities/user.entity";

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
export class UserCommission {
  @Prop({ default: "" })
  appliedById: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ enum: applicationType, default: applicationType.BLANK })
  applicationType: applicationType;

  @Prop({ default: "" })
  applicationId: string;

  @Prop({ enum: Role, required: true })
  commissionFor: Role;

  @Prop({ default: "" })
  srn: string;
  @Prop({ default: "" })
  sjbtCode: string;

  @Prop({ enum: transactionType, required: true })
  commissionTransactionType: transactionType;

  @Prop({ default: "" })
  logs: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type UserCommissionDocument = UserCommission & Document;
export const UserCommissionSchema =
  SchemaFactory.createForClass(UserCommission);
