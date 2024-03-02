import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { serviceType } from '../../price-config/entities/price-config.entity';

@Schema({ timestamps: true })
export class userAndServiceWiseRewardConfigHistory {
  @Prop({ required: true, enum: serviceType })
  serviceName: serviceType;

  @Prop({ required: true })
  updatedById: string;

  @Prop({ required: true })
  previousRewardForDistributor: number;

  @Prop({ required: true })
  previousRewardForRetailer: number;

  @Prop({ default: 0 })
  previousRewardForGuest: number;

  @Prop({ required: true })
  updatedRewardForDistributor: number;

  @Prop({ required: true })
  updatedRewardForRetailer: number;

  @Prop({ default: 0 })
  updatedRewardForGuest: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type userAndServiceWiseRewardConfigHistoryDocument =
  userAndServiceWiseRewardConfigHistory & Document;
export const userAndServiceWiseRewardConfigHistorySchema =
  SchemaFactory.createForClass(userAndServiceWiseRewardConfigHistory);
