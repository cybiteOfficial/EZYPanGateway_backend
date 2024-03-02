import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RetailerRewardUpdateHistory {
  @Prop({ required: true })
  updatedById: string;

  @Prop({ required: true })
  updatedRetailerRegisterRewardPoint: number;

  @Prop({ required: true })
  previousRetailerRewardUpdateHistoryPoint: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RetailerRewardUpdateHistoryDocument = RetailerRewardUpdateHistory &
  Document;
export const RetailerRewardUpdateHistorySchema = SchemaFactory.createForClass(
  RetailerRewardUpdateHistory,
);
