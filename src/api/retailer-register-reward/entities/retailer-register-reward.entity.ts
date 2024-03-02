import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RetailerRegisterReward {
  @Prop({ required: true })
  retailerRegisterRewardPoint: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RetailerRegisterRewardDocument = RetailerRegisterReward & Document;
export const RetailerRegisterRewardSchema = SchemaFactory.createForClass(
  RetailerRegisterReward,
);
