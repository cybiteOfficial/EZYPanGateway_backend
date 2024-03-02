import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { serviceType } from '../../price-config/entities/price-config.entity';

@Schema({ timestamps: true })
export class userAndServiceWiseRewardConfig {
  @Prop({ required: true, enum: serviceType })
  serviceName: serviceType;

  @Prop({ required: true })
  rewardForDistributor: number;

  @Prop({ required: true })
  rewardForRetailer: number;

  @Prop({ default: 0 })
  rewardForGuest: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type userAndServiceWiseRewardConfigDocument =
  userAndServiceWiseRewardConfig & Document;
export const userAndServiceWiseRewardConfigSchema =
  SchemaFactory.createForClass(userAndServiceWiseRewardConfig);
