import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RewardValueConfig {
  @Prop({ required: true })
  perRupeeRewardValue: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RewardValueConfigDocument = RewardValueConfig & Document;
export const RewardValueConfigSchema =
  SchemaFactory.createForClass(RewardValueConfig);
