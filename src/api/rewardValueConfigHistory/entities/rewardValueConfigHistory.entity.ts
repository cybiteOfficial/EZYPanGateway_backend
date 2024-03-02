import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RewardValueConfigHistory {
  @Prop({ required: true })
  previousRewardValue: number;

  @Prop({ required: true })
  updatedRewardValue: number;

  @Prop({ required: true })
  updatedById: string;

  @Prop({ required: true })
  updatedByType: string;

  @Prop({ required: true })
  updatedOnDate: string;

  @Prop({ required: true })
  remark: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RewardValueConfigHistoryDocument = RewardValueConfigHistory &
  Document;
export const RewardValueConfigHistorySchema = SchemaFactory.createForClass(
  RewardValueConfigHistory,
);
