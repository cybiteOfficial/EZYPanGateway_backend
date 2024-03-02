import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum, IsNumber } from "class-validator";
import { ObjectId } from "bson";
import { categoryCode } from "../../pan-category/entities/pan-category.entity";
import { paymentStatus } from "../../transaction/entities/transaction.entity";

export enum appliedFrom {
  WEB = "WEB",
  APP = "APP",
}

export enum applicationTypes {
  NEW = "NEW",
  CORRECTION = "CORRECTION",
}

export enum title {
  BLANK = "",
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
  COMPANY = "COMPANY",
  TRUST = "TRUST",
  LIMITED_LIABILITY_PARTNERSHIP = "LIMITED LIABILITY PARTNERSHIP",
  FIRM = "FIRM",
  GOVERNMENT = "GOVERNMENT",
  HINDU_UNDIVIDED_FAMILY = "HINDU UNDIVIDED FAMILY",
  ARTIFICIAL_JURIDICAL_PERSON = "ARTIFICIAL JURIDICAL PERSON",
  LOCAL_AUTHORITY = "LOCAL AUTHORITY",
}

enum paymentCategory {
  BASIC_SERVICE = "BASIC_SERVICE",
}
export enum paymentCategories {
  BASIC_SERVICE = paymentCategory.BASIC_SERVICE,
  CAT_DSA = categoryCode.DSA,
  CAT_PCO = categoryCode.PCO,
  ADDITIONAL_CAT_1 = categoryCode.cat_2,
  ADDITIONAL_CAT_2 = categoryCode.cat_3,
}

@Schema({ timestamps: true })
export class PanApplicationFlow {
  @Prop()
  panApplicationId: string;

  @Prop({ default: "", enum: formCategory })
  category: formCategory;

  @Prop({ enum: title })
  title: title;

  @Prop()
  name: string;

  @Prop()
  dob: string;

  @Prop({ default: "" })
  parentName: string;

  @Prop({ enum: parantType })
  @IsEnum(parantType)
  parentType: string;

  @Prop()
  adhaarNumber: string;

  @Prop()
  mobileNumber: string;

  @Prop()
  email: string;

  @Prop()
  panCardFront: string;

  @Prop()
  passportPhotoUrl: string;

  @Prop()
  signaturePhotoUrl: string;

  @Prop()
  panFormFrontPhotoUrl: string;

  @Prop()
  panFormBackPhotoUrl: string;

  @Prop()
  adhaarFrontPhotoUrl: string;

  @Prop()
  adhaarBackPhotoUrl: string;

  @Prop({ default: [], type: Array })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop()
  srn: string;

  @Prop({ default: "" })
  distributorCode: string;

  @Prop({ default: "" })
  distributorId: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ default: "" })
  txnId: "";

  @Prop({ default: "" })
  uniqueTransactionId: string;

  @Prop({ type: Object, default: {} })
  payementDetails: object;

  @Prop({ type: Array })
  paymentCategory: [];

  @Prop()
  version: string;

  @Prop({ default: "" })
  panNumber: string;

  @Prop({ default: 0 })
  totalPrice: number;

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

  @Prop({ default: 0 })
  applicationIndividualPrice: number;

  @Prop({ default: "" })
  baseCatAppied: string;

  @Prop({ default: 0 })
  refundWalletAmountApplied: number;

  @Prop({ default: 0 })
  rewardWalletAmountApplied: number;

  @Prop({ default: "" })
  acknowledgementNumber: string;

  @Prop({ default: "" })
  acknowledgementPdf: string;

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
  comments: string;
  @Prop({ default: "" })
  cartApplicationId: string;

  @Prop({ default: applicationTypes.NEW, enum: applicationTypes })
  applicationType: applicationTypes;

  @Prop({ default: "", trim: true })
  appliedByUserCurrentAddress: string;

  @Prop({ enum: appliedFrom })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

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
  retailerName: string;

  @Prop({ default: "" })
  retailerFirmName: string;

  @Prop({ default: "" })
  retailerFirmAddress: string;

  @Prop({ default: "" })
  retailerMobileNumber: string;

  @Prop({ default: "" })
  retailerPanNumber: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: "" })
  statusToShow: String;
}

export type PanApplicationFlowDocument = PanApplicationFlow & Document;
export const PanAppFlowSchema =
  SchemaFactory.createForClass(PanApplicationFlow);
