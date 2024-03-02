import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { serviceType } from "../../price-config/entities/price-config.entity";
import { IsEnum } from "class-validator";
import { categoryCode } from "src/api/pan-category/entities/pan-category.entity";

@Schema({ timestamps: true })
export class CommissionUpdateHistory {
  @Prop({ required: true, enum: serviceType })
  @IsEnum(serviceType)
  serviceName: serviceType;

  @Prop({ required: true, trim: true })
  commissionName: string;

  @Prop({ default: "BASIC_SERVICE", trim: true })
  categoryType: string;

  @Prop({ required: true })
  minimumApplications: number;

  @Prop({ required: true, trim: true })
  updatedById: string;

  @Prop({ required: true })
  previousCommissionForDistributor: number;

  @Prop({ required: true })
  updatedCommissionForDistributor: number;

  @Prop({ default: 0 })
  commissionForRetailer: number;

  @Prop({ default: 0 })
  commissionForGuest: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type CommissionUpdateHistoryDocument = CommissionUpdateHistory &
  Document;
export const CommissionUpdateHistorySchema = SchemaFactory.createForClass(
  CommissionUpdateHistory
);
