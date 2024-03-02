import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { IsEnum, IsNumber } from "class-validator";
import { paymentStatus } from "../../transaction/entities/transaction.entity";

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
export class DigitalSignFlow {
  @Prop()
  digitalSignId: string;

  @Prop({ default: "" })
  cartApplicationId: string;

  @Prop()
  propritorName: string;

  @Prop()
  srn: string;

  @Prop()
  email: string;

  @Prop()
  mobileNumber: string;

  @Prop()
  adhaarNumber: string;

  @Prop()
  address: string;

  @Prop()
  photoUrl: string;

  @Prop()
  adhaarCardPhotoUrl: string;

  @Prop()
  panCardPhotoUrl: string;

  @Prop({ default: "" })
  appliedBy: string;

  @Prop({ default: "" })
  appliedAs: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ default: "" })
  txnId: "";

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ default: 0, trim: true })
  serialNumber: number;

  @Prop({ default: {}, type: Object })
  payementDetails: object;

  @Prop({ enum: appliedFrom })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

  @Prop()
  version: string;

  @Prop({ default: "" })
  acknowledgementPdf: string;

  @Prop({ default: "" })
  assignedTo: string;

  @Prop({ default: "" })
  assignedBy: string;

  @Prop({ default: "" })
  comments: string;

  @Prop({ default: [], type: Array })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: "" })
  distributorCode: string;

  @Prop({ default: "" })
  distributorId: string;

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

  @Prop({ default: "" })
  acknowledgementNumber: string;

  @Prop({ default: "" })
  rejectionReason: string;

  @Prop({ default: "" })
  remark: string;

  @Prop({ default: status.BLANK, enum: status })
  @IsEnum(status)
  status: status;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus, trim: true })
  @IsEnum(paymentStatus)
  txnStatus: paymentStatus;

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

  @Prop({ default: "", trim: true })
  appliedByUserCurrentAddress: string;

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
  retailerName: string;

  @Prop({ default: "" })
  retailerFirmName: string;

  @Prop({ default: "" })
  retailerFirmAddress: string;

  @Prop({ default: "" })
  retailerMobileNumber: string;

  @Prop({ default: "" })
  retailerPanNumber: string;

  @Prop({ default: [], type: Array })
  paymentCategory: [];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: "" })
  statusToShow: String;
}

export type DigitalSignFlowDocument = DigitalSignFlow & Document;
export const DigitalSignFlowSchema =
  SchemaFactory.createForClass(DigitalSignFlow);
