import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { IsEnum } from "class-validator";
import { paymentStatus } from "../../transaction/entities/transaction.entity";
import { flowStatus } from "../../../api/panapplications/entities/pan.entity";

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

export enum appliedFrom {
  WEB = "WEB",
  APP = "APP",
}

@Schema({ timestamps: true })
export class MsmeCart {
  @Prop({ required: true, trim: true })
  propritorName: string;

  @Prop({ required: true, trim: true })
  adhaarNumber: string;

  @Prop({ required: true, trim: true })
  firmName: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ default: "", trim: true })
  srn: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  mobileNumber: string;

  @Prop({ required: true, trim: true })
  photoUrl: string;

  @Prop({ required: true, trim: true })
  adhaarCardPhotoUrl: string;

  @Prop({ default: "", trim: true })
  distributorCode: string;

  @Prop({ default: "", trim: true })
  distributorId: string;

  @Prop({ default: "" })
  cartApplicationId: string;

  @Prop({ required: true, trim: true })
  panCardPhotoUrl: string;

  @Prop({ default: [], type: Array, trim: true })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: "", trim: true })
  acknowledgementNumber: string;

  @Prop({ default: "", trim: true })
  acknowledgementPdf: string;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  applicationIndividualPrice: number;

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

  @Prop({ default: "", trim: true })
  appliedBy: string;

  @Prop({ default: "", trim: true })
  appliedAs: string;

  @Prop({ default: "" })
  txnId: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ default: {}, type: Object })
  paymentDetails: object;

  @Prop({ enum: appliedFrom, required: true })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus, trim: true })
  @IsEnum(paymentStatus)
  txnStatus: paymentStatus;

  @Prop({ default: "", trim: true })
  version: string;

  @Prop({ enum: status, trim: true })
  @IsEnum(status)
  status: status;

  @Prop({ default: "", trim: true })
  appliedByType: string;

  @Prop({ default: "", trim: true })
  appliedById: string;

  @Prop({ default: "", trim: true })
  appliedOnDate: string;

  @Prop({ default: "", trim: true })
  appliedByName: string;

  @Prop({ default: "", trim: true })
  appliedByNumber: string;

  @Prop({ default: "", trim: true })
  appliedAsType: string;

  @Prop({ default: "", trim: true })
  assignedToName: string;

  @Prop({ default: "", trim: true })
  assignedToId: string;

  @Prop({ default: "", trim: true })
  assignedOnDate: string;

  @Prop({ default: "", trim: true })
  assignedByName: string;

  @Prop({ default: "", trim: true })
  assignedById: string;

  @Prop({ default: "", trim: true })
  verifiedByName: string;

  @Prop({ default: "", trim: true })
  verifiedById: string;

  @Prop({ default: "", trim: true })
  verifiedOnDate: string;

  @Prop({ default: "", trim: true })
  rejectedByName: string;

  @Prop({ default: "", trim: true })
  rejectedById: string;

  @Prop({ default: "", trim: true })
  rejectionReason: string;

  @Prop({ default: "", trim: true })
  rejectedOnDate: string;

  @Prop({ default: "", trim: true })
  generatedByName: string;

  @Prop({ default: "", trim: true })
  generatedById: string;

  @Prop({ default: "", trim: true })
  generatedOnDate: string;

  @Prop({ default: "", trim: true })
  completedByName: string;

  @Prop({ default: "", trim: true })
  completedById: string;

  @Prop({ default: "", trim: true })
  completedOnDate: string;

  @Prop({ default: "", trim: true })
  cancelledByName: string;

  @Prop({ default: "", trim: true })
  cancelledById: string;

  @Prop({ default: "", trim: true })
  cancelledOnDate: string;

  @Prop({ default: "", trim: true })
  moveToPendingByName: string;

  @Prop({ default: "", trim: true })
  moveToPendingById: string;

  @Prop({ default: "", trim: true })
  moveToPendingOnDate: string;

  @Prop({ default: true, trim: true })
  IsAgreedToTermsAndConditions: boolean;

  @Prop({ default: "", trim: true })
  retailerId: string;

  @Prop({ default: "", trim: true })
  retailerName: string;

  @Prop({ default: "", trim: true })
  retailerFirmName: string;

  @Prop({ default: "", trim: true })
  retailerFirmAddress: string;

  @Prop({ default: "", trim: true })
  retailerMobileNumber: string;

  @Prop({ default: "", trim: true })
  retailerPanNumber: string;

  @Prop({ default: [], type: Array })
  paymentCategory: [];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0, trim: true })
  serialNumber: number;

  @Prop({ default: "", trim: true })
  uniqueTransactionId: string;

  @Prop({ default: flowStatus.STATUS_CHANGED, trim: true })
  statusToShow: String;
}

export type MsmeCartDocument = MsmeCart & Document;
export const MsmeCartSchema = SchemaFactory.createForClass(MsmeCart);
