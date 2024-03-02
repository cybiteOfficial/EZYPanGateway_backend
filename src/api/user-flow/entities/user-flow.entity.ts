import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum } from "class-validator";
import { ObjectId, Types } from "mongoose";

export enum Role {
  DISTRIBUTOR = "DISTRIBUTOR",
  RETAILER = "RETAILER",
  GUEST = "GUEST",
}

export enum status {
  BLANK = "",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

@Schema({ timestamps: true })
export class UserFlow {
  @Prop()
  userId: string;

  @Prop({ default: "" })
  name: string;

  @Prop({ default: "" })
  email: string;

  @Prop({ default: "" })
  mobileNumber: string;

  @Prop({ default: "" })
  dob: string;

  @Prop({ default: "" })
  fatherName: string;

  @Prop({ default: "" })
  firmName: string;

  @Prop({ default: "" })
  address: string;

  @Prop({ default: "" })
  area: string;

  @Prop({ default: "" })
  cityVillageName: string;

  @Prop({ default: "" })
  district: string;

  @Prop({ default: "", trim: true })
  pincode: string;

  @Prop({ default: "" })
  state: string;

  @Prop({ default: "" })
  adhaarCardImage: string;

  @Prop({ default: "" })
  panCardImage: string;

  @Prop({ default: "" })
  cancelChequeImage: string;

  @Prop({ default: "" })
  declarationFormPhotoUrl: string;

  @Prop({ default: "" })
  password: string;

  @Prop({ default: "" })
  sjbtCode: string;

  @Prop({ default: "" })
  rejectionReason: string;

  @Prop({ enum: Role })
  @IsEnum(Role)
  userType: Role;

  @Prop({ enum: status })
  @IsEnum(status)
  status: status;

  @Prop()
  panNumber: string;

  @Prop()
  isDeleted: boolean;

  @Prop()
  isActive: boolean;

  @Prop()
  isVerified: boolean;

  @Prop()
  isBlocked: boolean;

  @Prop()
  emailVerified: boolean;

  @Prop()
  mobileNumberVerified: boolean;
  @Prop()
  deviceType: string;

  @Prop()
  isAppliedForDistributor: boolean;

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
}

export type UserFlowDocument = UserFlow & Document;
export const UserFlowSchema = SchemaFactory.createForClass(UserFlow);
