import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum, IsNumber } from "class-validator";
import { ObjectId } from "bson";
import { paymentStatus } from "../../transaction/entities/transaction.entity";
import { flowStatus } from "../../../api/panapplications/entities/pan.entity";

export enum appliedFrom {
  WEB = "WEB",
  APP = "APP",
}

export enum applicationTypes {
  NEW = "NEW",
  CORRECTION = "CORRECTION",
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

export enum formCategory {
  BLANK = "",
  INDIVIDUAL = "INDIVIDUAL",
  ASSOCIATION_OF_PERSONS = "ASSOCIATION OF PERSONS",
  BODY_OF_INDIVIDUALS = "BODY OF INDIVIDUALS",
  COMPanCartY = "COMPanCartY",
  TRUST = "TRUST",
  LIMITED_LIABILITY_PARTNERSHIP = "LIMITED LIABILITY PARTNERSHIP",
  FIRM = "FIRM",
  GOVERNMENT = "GOVERNMENT",
  HINDU_UNDIVIDED_FAMILY = "HINDU UNDIVIDED FAMILY",
  ARTIFICIAL_JURIDICAL_PERSON = "ARTIFICIAL JURIDICAL PERSON",
  LOCAL_AUTHORITY = "LOCAL AUTHORITY",
}

@Schema({ timestamps: true })
export class PanCart {
  @Prop({ default: "", enum: formCategory })
  category: formCategory;

  @Prop({ default: "", enum: title, trim: true })
  title: title;

  @Prop({ default: "", required: true, trim: true })
  name: string;

  @Prop({ default: "", required: true, trim: true })
  dob: string;

  @Prop({ default: "", trim: true })
  parentName: string;

  @Prop({ default: "", required: true, enum: parantType })
  @IsEnum(parantType)
  parentType: string;

  @Prop({ default: "", required: true, trim: true })
  adhaarNumber: string;

  @Prop({ default: "", required: true, trim: true })
  mobileNumber: string;

  @Prop({ default: "", trim: true, lowercase: true })
  email: string;

  @Prop({ default: "", trim: true })
  panNumber: string;

  @Prop({ default: "", trim: true })
  panCardFront: string;

  @Prop({ default: "", required: true, trim: true })
  passportPhotoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  signaturePhotoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  panFormFrontPhotoUrl: string;

  @Prop({ default: "", trim: true })
  panFormBackPhotoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  adhaarFrontPhotoUrl: string;

  @Prop({ default: "", required: true, trim: true })
  adhaarBackPhotoUrl: string;

  @Prop({ default: [], type: Array })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: "", trim: true })
  srn: string;

  @Prop({ default: "", trim: true })
  distributorCode: string;

  @Prop({ default: "", trim: true })
  distributorId: string;

  @Prop({ default: "" })
  cartApplicationId: string;

  @Prop({ default: "" })
  txnId: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ type: Object, default: {} })
  payementDetails: object;

  @Prop({ default: "", type: Array, required: true })
  paymentCategory: [];

  @Prop({ default: "", trim: true })
  version: string;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  applicationIndividualPrice: number;

  @Prop({ default: 0 })
  mainCategoryPrice: number;

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

  @Prop({ default: "", trim: true })
  acknowledgementNumber: string;

  @Prop({ default: "", trim: true })
  acknowledgementPdf: string;

  @Prop({ default: "", trim: true })
  rejectionReason: string;

  @Prop({ default: "", trim: true })
  remark: string;

  @Prop({ default: status.BLANK, enum: status })
  @IsEnum(status)
  status: status;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus, trim: true })
  @IsEnum(paymentStatus)
  txnStatus: paymentStatus;

  @Prop({ default: "", trim: true })
  comments: string;

  @Prop({ default: applicationTypes.NEW, enum: applicationTypes, trim: true })
  applicationType: applicationTypes;

  @Prop({ enum: appliedFrom, trim: true, required: true })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

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

  @Prop({ default: "", trim: true })
  retailerPanNumber: string;

  @Prop({ default: 0 })
  serialNumber: number;

  @Prop({ default: "", trim: true })
  uniqueTransactionId: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: flowStatus.STATUS_CHANGED, trim: true })
  statusToShow: String;
}

export type PanCartDocument = PanCart & Document;
export const PanCartSchema = SchemaFactory.createForClass(PanCart);
