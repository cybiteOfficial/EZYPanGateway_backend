import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class DigitalPanWallet {
  @Prop({ default: 0 })
  walletAmount: number;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  freezeAmount: number;

  @Prop({ default: false })
  lock: boolean;
}

export type DigitalPanWalletDocument = DigitalPanWallet & Document;
export const DigitalPanWalletSchema =
  SchemaFactory.createForClass(DigitalPanWallet);
