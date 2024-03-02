import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum } from "class-validator";
import { Types } from "mongoose";
import { ObjectId } from "bson";

@Schema({ timestamps: true })
export class DistributorRetailers {
  @Prop({ default: "", lowercase: true, trim: true })
  distributorId: string;

  @Prop({ default: "", lowercase: true, trim: true })
  retailerId: string;

  @Prop({ default: "", trim: true })
  sjbtCode: string;

  @Prop({ default: "", trim: true })
  loginDate: string;

  @Prop({ default: false, trim: true })
  isDeleted: false;
}

export type DistributorRetailerDocument = DistributorRetailers & Document;
export const DistributorRetailersSchema =
  SchemaFactory.createForClass(DistributorRetailers);
