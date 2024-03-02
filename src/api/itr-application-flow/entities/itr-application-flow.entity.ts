import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { IsEnum } from "class-validator";

export enum incomeSource {
  SALARY = "SALARY",
  BUSINESS = "BUSINESS",
}

export enum fillingType {
  NEW = "NEW",
  RENEWAL = "RENEWAL",
}

export enum appliedFrom {
  WEB = "WEB",
  APP = "APP",
}
export enum status {
  BLANK = "PAYMENT_PENDING",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  VERIFY = "VERIFY",
  REJECT = "REJECT",
  GENERATE = "GENERATE",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

@Schema({ timestamps: true })
export class ItrApplicationFlow {
  @Prop()
  itrApplicationId: string;

  @Prop()
  firstName: string;

  @Prop()
  middleName: string;

  @Prop()
  lastName: string;

  @Prop()
  adhaarNumber: string;

  @Prop()
  assesmentYear: string;

  @Prop({ enum: incomeSource })
  @IsEnum(incomeSource)
  incomeSource: incomeSource;

  @Prop({ enum: fillingType })
  @IsEnum(fillingType)
  fillingType: fillingType;

  @Prop()
  mobileNumber: string;

  @Prop()
  emailId: string;

  @Prop()
  adhaarFrontPhotoUrl: string;

  @Prop()
  adhaarBackPhotoUrl: string;
  @Prop({ default: "" })
  cartApplicationId: string;

  @Prop()
  panCardPhotoUrl: string;

  @Prop()
  banPassbookPhotoUrl: string;

  @Prop({ default: [], type: Array })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: "" })
  distributorCode: string;

  @Prop({ default: "" })
  distributorId: string;

  @Prop({ default: "" })
  txnId: ObjectId;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ type: Object })
  payementDetails: object;

  @Prop({ default: "" })
  srn: string;

  @Prop({ type: Array })
  paymentCategory: [];

  @Prop({ enum: appliedFrom })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

  @Prop()
  version: string;

  @Prop({ default: "" })
  acknowledgementNumber: string;

  @Prop({ default: "" })
  acknowledgementPdf: string;

  @Prop({ enum: status })
  @IsEnum(status)
  status: status;

  @Prop({ default: "" })
  comments: string;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  applicationIndividualPrice: number;

  @Prop({ default: 0 })
  additionalCat2: number;

  @Prop({ default: 0 })
  additionalCat3: number;

  @Prop({ default: 0 })
  convinienceCharges: number;

  @Prop({ default: 0 })
  basePrice: number;

  @Prop({ default: "" })
  baseCatAppied: string;

  @Prop({ default: 0 })
  refundWalletAmountApplied: number;

  @Prop({ default: 0 })
  rewardWalletAmountApplied: number;

  @Prop({ default: "" })
  rejectionReason: string;

  @Prop({ default: "" })
  remark: string;

  @Prop({ default: "", trim: true })
  appliedByUserCurrentAddress: string;

  @Prop({ default: "" })
  appliedByType: string;

  @Prop({ default: "" })
  appliedById: string;

  @Prop({ default: "" })
  appliedOnDate: string;

  @Prop({ default: "" })
  appliedByName: string;

  @Prop({ default: "" })
  appliedByNumber: string;

  @Prop({ default: "" })
  appliedAsType: string;

  @Prop({ default: "" })
  assignedToName: string;

  @Prop({ default: "" })
  assignedToId: string;

  @Prop({ default: "" })
  assignedOnDate: string;

  @Prop({ default: "" })
  assignedByName: string;

  @Prop({ default: "" })
  assignedById: string;

  @Prop({ default: "" })
  verifiedByName: string;

  @Prop({ default: "" })
  verifiedById: string;

  @Prop({ default: "" })
  verifiedOnDate: string;

  @Prop({ default: "" })
  rejectedByName: string;

  @Prop({ default: "" })
  rejectedById: string;

  @Prop({ default: "" })
  rejectedOnDate: string;

  @Prop({ default: "" })
  generatedByName: string;

  @Prop({ default: "" })
  generatedById: string;

  @Prop({ default: "" })
  generatedOnDate: string;

  @Prop({ default: "" })
  completedByName: string;

  @Prop({ default: "" })
  completedById: string;

  @Prop({ default: "" })
  completedOnDate: string;

  @Prop({ default: "" })
  cancelledByName: string;

  @Prop({ default: "" })
  cancelledById: string;

  @Prop({ default: "" })
  cancelledOnDate: string;

  @Prop({ default: "", trim: true })
  moveToPendingByName: string;

  @Prop({ default: "", trim: true })
  moveToPendingById: string;

  @Prop({ default: "", trim: true })
  moveToPendingOnDate: string;

  @Prop({ default: true, trim: true })
  IsAgreedToTermsAndConditions: boolean;

  @Prop({ default: "" })
  retailerId: string;

  @Prop({ default: "" })
  retailerMobileNumber: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: "" })
  statusToShow: String;
}

export type ItrApplicationFlowDocument = ItrApplicationFlow & Document;
export const ItrApplicationFlowSchema =
  SchemaFactory.createForClass(ItrApplicationFlow);
