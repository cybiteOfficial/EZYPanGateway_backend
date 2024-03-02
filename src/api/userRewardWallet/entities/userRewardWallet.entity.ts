import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class UserRewardWallet {
  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  totalReward: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type UserRewardWalletDocument = UserRewardWallet & Document;
export const UserRewardWalletSchema =
  SchemaFactory.createForClass(UserRewardWallet);
