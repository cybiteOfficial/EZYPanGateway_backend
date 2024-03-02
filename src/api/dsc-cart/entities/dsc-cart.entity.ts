import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { IsEnum, IsNumber } from "class-validator";
import { paymentStatus } from "../../transaction/entities/transaction.entity";
import { flowStatus } from "../../../api/panapplications/entities/pan.entity";

export enum appliedFrom {
  WEB = "WEB",
  APP = "APP",
}

export enum title {
  MR = "Mr.",
  MRS = "Mrs.",
  MISS = "Miss",
}
export enum parantType {
  FATHER = "FATHER",
  MOTHER = "MOTHER",
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
export class DscCart {
  @Prop({ default: "", required: true, trim: true })
  propritorName: string;

  @Prop({ defaut: "" })
  srn: string;

  @Prop({ default: "", required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ default: "", required: true, trim: true })
  mobileNumber: string;

  @Prop({ default: "", required: true, trim: true })
  adhaarNumber: string;

  @Prop({ default: "", required: true, trim: true })
  address: string;

  @Prop({ default: "", required: true, trim: true })
  photoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  adhaarCardPhotoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  panCardPhotoUrl: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ default: "" })
  txnId: "";

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ default: {}, type: Object })
  payementDetails: object;

  @Prop({ enum: appliedFrom, trim: true, required: true })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

  @Prop({ default: "", trim: true })
  version: string;

  @Prop({ default: "", trim: true })
  acknowledgementPdf: string;

  @Prop({ default: "", trim: true })
  assignedTo: string;

  @Prop({ default: "", trim: true })
  assignedBy: string;

  @Prop({ default: [], type: Array, trim: true })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: "", trim: true })
  distributorCode: string;

  @Prop({ default: "", trim: true })
  distributorId: string;

  @Prop({ default: "" })
  cartApplicationId: string;

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
  acknowledgementNumber: string;

  @Prop({ default: "", trim: true })
  rejectionReason: string;

  @Prop({ default: "", trim: true })
  remark: string;

  @Prop({ default: status.BLANK, enum: status, trim: true })
  @IsEnum(status)
  status: status;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus, trim: true })
  @IsEnum(paymentStatus)
  txnStatus: paymentStatus;

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

  @Prop({ default: 0, trim: true })
  serialNumber: number;

  @Prop({ default: [], type: Array })
  paymentCategory: [];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: flowStatus.STATUS_CHANGED, trim: true })
  statusToShow: String;
}

export type DscCartDocument = DscCart & Document;
export const DscCartSchema = SchemaFactory.createForClass(DscCart);
