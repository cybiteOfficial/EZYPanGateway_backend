import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum } from "class-validator";
import { Types } from "mongoose";
import { ObjectId } from "bson";
import { SubscriptionType } from "../../subscription-flow/entities/subscription-flow.entity";
import { paymentStatus } from "../../transaction/entities/transaction.entity";
import { appliedFrom } from "src/api/panapplications/entities/pan.entity";

export enum Role {
  DISTRIBUTOR = "DISTRIBUTOR",
  RETAILER = "RETAILER",
  GUEST = "GUEST",
}

export enum VerifyStatus {
  BLANK = "",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum subscriptionPayment {
  BLANK = "",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
}

@Schema({ timestamps: true })
export class User {
  @Prop({ default: "", lowercase: true, trim: true })
  name: string;

  @Prop({ default: "", lowercase: true, trim: true })
  email: string;

  @Prop({ default: "", trim: true })
  mobileNumber: string;

  @Prop({ default: "", trim: true })
  dob: string;

  @Prop({ default: "", trim: true, lowercase: true })
  fatherName: string;

  @Prop({ default: "", trim: true, lowercase: true })
  firmName: string;

  @Prop({ default: "", lowercase: true, trim: true })
  address: string;

  @Prop({ default: "", lowercase: true, trim: true })
  area: string;

  @Prop({ default: "", lowercase: true, trim: true })
  cityVillageName: string;

  @Prop({ default: "", lowercase: true, trim: true })
  district: string;

  @Prop({ default: "", trim: true })
  pincode: string;

  @Prop({ default: "", lowercase: true, trim: true })
  state: string;

  @Prop({ default: "", trim: true })
  adhaarCardImage: string;

  @Prop({ default: "", trim: true })
  panCardImage: string;

  @Prop({ default: "", trim: true })
  cancelChequeImage: string;

  @Prop({ default: "", trim: true })
  declarationFormPhotoUrl: string;

  @Prop({ default: "", trim: true })
  password: string;

  @Prop({ default: "", trim: true })
  sjbtCode: string;

  @Prop({ default: "", trim: true })
  rejectionReason: string;

  @Prop({ required: true, enum: Role })
  @IsEnum(Role)
  userType: Role;

  @Prop({ default: VerifyStatus.BLANK, enum: VerifyStatus })
  @IsEnum(VerifyStatus)
  status: VerifyStatus;

  @Prop({ default: "", trim: true })
  panNumber: string;

  @Prop({ default: "", trim: true })
  role: string;

  @Prop({ default: false })
  isProfileComplete: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  isAppliedForDistributor: boolean;

  @Prop({ default: false })
  mobileNumberVerified: boolean;

  @Prop({
    default: [],
    type: [{ distributorId: Types.ObjectId, sjbtCode: String, date: String }],
  })
  allDistributor: {
    distributorId: Types.ObjectId;
    sjbtCode: string;
    date: string;
  }[];

  @Prop({
    type: { panCategories: [Types.ObjectId], itrCategories: [Types.ObjectId] },
    default: {},
  })
  category: {
    panCategories: Types.ObjectId[];
    itrCategories: Types.ObjectId[];
  };

  @Prop({
    type: Array,
    default: [],
  })
  services: string[];

  @Prop({ default: [], type: Array })
  logs: string[];

  @Prop({ default: "", trim: true })
  subscriptionId: string;

  @Prop({ default: SubscriptionType.BLANK, enum: SubscriptionType })
  @IsEnum(SubscriptionType)
  subscriptionType: SubscriptionType;

  @Prop({ default: "", trim: true })
  subscriptionPlanExpiryDate: string;

  @Prop({ default: subscriptionPayment.BLANK, enum: subscriptionPayment })
  @IsEnum(subscriptionPayment)
  subscriptionPayment: subscriptionPayment;

  @Prop({ default: "", trim: true })
  subscriptionTxnDate: string;

  @Prop({ default: 0, trim: true }) ///////update this key to required when paymnet gateway applied
  serialNumber: string;

  @Prop({ default: "", trim: true })
  uniqueTransactionId: string;

  @Prop({ default: "" })
  txnObjectId: ObjectId;

  @Prop({ enum: appliedFrom })
  deviceType: string;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus, trim: true })
  @IsEnum(paymentStatus)
  subscriptionTxnStatus: paymentStatus;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
