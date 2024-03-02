import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IsEnum } from 'class-validator';
import { categoryCode } from '../../pan-category/entities/pan-category.entity';
import { paymentStatus } from '../../transaction/entities/transaction.entity';
import { flowStatus } from 'src/api/panapplications/entities/pan.entity';

export enum incomeSource {
  SALARY = 'SALARY',
  BUSINESS = 'BUSINESS',
}

export enum fillingType {
  NEW = 'NEW',
  RENEWAL = 'RENEWAL',
}

export enum appliedFrom {
  WEB = 'WEB',
  APP = 'APP',
}
export enum status {
  BLANK = 'PAYMENT_PENDING',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFY = 'VERIFY',
  REJECT = 'REJECT',
  GENERATE = 'GENERATE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

enum paymentCategory {
  BASIC_SERVICE = 'BASIC_SERVICE',
}
export enum paymentCategories {
  BASIC_SERVICE = paymentCategory.BASIC_SERVICE,
  CAT_DSA = categoryCode.DSA,
  CAT_PCO = categoryCode.PCO,
  ADDITIONAL_CAT_1 = categoryCode.cat_2,
  ADDITIONAL_CAT_2 = categoryCode.cat_3,
}

export enum urlFields {
  panCardPhotoUrl = 'Pan card photo url',
  banPassbookPhotoUrl = 'Bank passbook photo url',
  adhaarFrontPhotoUrl = 'Adhaar front photo url',
  adhaarBackPhotoUrl = 'Adhaar back photo url',
}

@Schema({ timestamps: true })
export class ItrApplication {
  @Prop({ default: '', required: true, trim: true })
  firstName: string;

  @Prop({ default: '', trim: true })
  middleName: string;

  @Prop({ default: '', trim: true })
  lastName: string;

  @Prop({ default: '', required: true, trim: true })
  adhaarNumber: string;

  @Prop({ default: '', required: true, trim: true })
  assesmentYear: string;

  @Prop({ enum: incomeSource, trim: true })
  @IsEnum(incomeSource)
  incomeSource: incomeSource;

  @Prop({ enum: fillingType, trim: true })
  @IsEnum(fillingType)
  fillingType: fillingType;

  @Prop({ default: '', required: true, trim: true })
  mobileNumber: string;

  @Prop({ default: '', required: true, trim: true, lowercase: true })
  emailId: string;

  @Prop({ default: '', required: true, trim: true })
  adhaarFrontPhotoUrl: string;

  @Prop({ default: '', required: true, trim: true })
  adhaarBackPhotoUrl: string;

  @Prop({ default: '', required: true, trim: true })
  panCardPhotoUrl: string;

  @Prop({ default: '', required: true, trim: true })
  banPassbookPhotoUrl: string;

  @Prop({ default: [], type: Array, trim: true })
  otherDocuments: { title: string; imageUrl: string }[];

  @Prop({ default: '', trim: true })
  distributorCode: string;

  @Prop({ default: '', trim: true })
  distributorId: string;

  @Prop({ default: '' })
  cartApplicationId: string;

  @Prop({ default: '' })
  txnId: ObjectId;

  @Prop({ default: '' })
  txnObjectId: ObjectId;

  @Prop({ default: '' })
  uniqueTransactionId: string;

  @Prop({ default: 0 })
  serialNumber: number;

  @Prop({ default: {}, type: Object })
  payementDetails: object;

  @Prop({ default: '', trim: true })
  srn: string;

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

  @Prop({ default: '' })
  baseCatAppied: string;

  @Prop({ default: 0 })
  refundWalletAmountApplied: number;

  @Prop({ default: 0 })
  rewardWalletAmountApplied: number;

  @Prop({ default: [], type: Array, required: true })
  paymentCategory: [];

  @Prop({ enum: appliedFrom, trim: true, required: true })
  @IsEnum(appliedFrom)
  appliedFrom: appliedFrom;

  @Prop({ default: '', trim: true })
  version: string;

  @Prop({ default: '', trim: true })
  acknowledgementNumber: string;

  @Prop({ default: '', trim: true })
  acknowledgementPdf: string;

  @Prop({ enum: status, trim: true })
  @IsEnum(status)
  status: status;

  @Prop({ enum: paymentStatus, dafault: paymentStatus.PENDING, trim: true })
  @IsEnum(paymentStatus)
  txnStatus: paymentStatus;

  @Prop({ default: '', trim: true })
  comments: string;

  @Prop({ default: '', trim: true })
  rejectionReason: string;

  @Prop({ default: '', trim: true })
  remark: string;

  @Prop({ default: '', trim: true })
  appliedByUserCurrentAddress: string;

  @Prop({ default: '', trim: true })
  appliedByType: string;

  @Prop({ default: '', trim: true })
  appliedById: string;

  @Prop({ default: '', trim: true })
  appliedOnDate: string;

  @Prop({ default: '', trim: true })
  appliedByName: string;

  @Prop({ default: '', trim: true })
  appliedByNumber: string;

  @Prop({ default: '', trim: true })
  appliedAsType: string;

  @Prop({ default: '', trim: true })
  assignedToName: string;

  @Prop({ default: '', trim: true })
  assignedToId: string;

  @Prop({ default: '', trim: true })
  assignedOnDate: string;

  @Prop({ default: '', trim: true })
  assignedByName: string;

  @Prop({ default: '', trim: true })
  assignedById: string;

  @Prop({ default: '', trim: true })
  verifiedByName: string;

  @Prop({ default: '', trim: true })
  verifiedById: string;

  @Prop({ default: '', trim: true })
  verifiedOnDate: string;

  @Prop({ default: '', trim: true })
  rejectedByName: string;

  @Prop({ default: '', trim: true })
  rejectedById: string;

  @Prop({ default: '', trim: true })
  rejectedOnDate: string;

  @Prop({ default: '', trim: true })
  generatedByName: string;

  @Prop({ default: '', trim: true })
  generatedById: string;

  @Prop({ default: '', trim: true })
  generatedOnDate: string;

  @Prop({ default: '', trim: true })
  completedByName: string;

  @Prop({ default: '', trim: true })
  completedById: string;

  @Prop({ default: '', trim: true })
  completedOnDate: string;

  @Prop({ default: '', trim: true })
  cancelledByName: string;

  @Prop({ default: '', trim: true })
  cancelledById: string;

  @Prop({ default: '', trim: true })
  cancelledOnDate: string;

  @Prop({ default: '', trim: true })
  moveToPendingByName: string;

  @Prop({ default: '', trim: true })
  moveToPendingById: string;

  @Prop({ default: '', trim: true })
  moveToPendingOnDate: string;

  @Prop({ default: true, trim: true })
  IsAgreedToTermsAndConditions: boolean;

  @Prop({ default: '' })
  retailerId: string;

  @Prop({ default: '', trim: true })
  retailerMobileNumber: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: flowStatus.STATUS_CHANGED, trim: true })
  statusToShow: String;
}

export type ItrApplicationDocument = ItrApplication & Document;
export const ItrApplicationSchema =
  SchemaFactory.createForClass(ItrApplication);
