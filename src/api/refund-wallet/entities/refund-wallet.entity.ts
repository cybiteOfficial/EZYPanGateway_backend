import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RefundWallet {
  @Prop({ default: 0 })
  walletAmount: number;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: '' })
  uuid: string;

  @Prop({ default: 0 })
  freezeAmount: number;
}

export type RefundWalletDocument = RefundWallet & Document;
export const RefundWalletSchema = SchemaFactory.createForClass(RefundWallet);
