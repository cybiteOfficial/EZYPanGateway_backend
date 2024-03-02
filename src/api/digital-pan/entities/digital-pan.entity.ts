import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { paymentStatus } from '../../transaction/entities/transaction.entity';

export enum appliedFrom {
  WEB = 'WEB',
  APP = 'APP',
}

export enum Extra1 {
  A = 'A',
  C = 'C',
}

export enum Type {
  Y = 'Y',
  N = 'N',
}

export enum status {
  BLANK = 'PAYMENT_PENDING',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFY = 'VERIFY',
  REJECT = 'REJECT',
  GENERATE = 'GENERATE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class DigitalPanApplication {
  @Prop({ default: Extra1.A, enum: Extra1 })
  @IsEnum(Extra1)
  Extra1: Extra1;

  @Prop({ default: Type.Y, enum: Type })
  @IsEnum(Type)
  Type: Type;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: '' })
  mobileNumber: string;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus })
  @IsEnum(paymentStatus)
  status: paymentStatus;

  @Prop({
    default: {
      Number: 0,
      Amount: 0,
      AckNo: '',
      OrderID: '',
      TxnDate: '',
      Status: '',
      Type: '',
    },
    type: {
      Number: Number,
      Amount: Number,
      AckNo: String,
      OrderID: String,
      TxnDate: String,
      Status: String,
      Type: String,
    },
  })
  Transactions: {
    Number: number;
    Amount: number;
    AckNo: string;
    OrderID: string;
    TxnDate: string;
    Status: string;
    Type: string;
  };

  @Prop({ default: '' })
  txnId: string;

  @Prop({ default: '' })
  agentID: string;

  @Prop({ default: '' })
  sessionId: string;

  @Prop({ default: '', trim: true })
  appliedByType: string;

  @Prop({ default: '', trim: true })
  appliedById: string;

  @Prop({ default: '', trim: true })
  appliedOnDate: string;

  @Prop({ default: '', trim: true })
  appliedByName: string;

  @Prop({ default: '', trim: true })
  appliedByNumber: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type DigitalPanDocument = DigitalPanApplication & Document;
export const DigitalPanSchema = SchemaFactory.createForClass(
  DigitalPanApplication,
);
