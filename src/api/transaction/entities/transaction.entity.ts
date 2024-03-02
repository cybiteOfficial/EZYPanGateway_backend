import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { serviceType } from '../../price-config/entities/price-config.entity';

export enum paymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export enum paytmStatus {
  TXN_STATUS_PENDING = 'PENDING',
  TXN_STATUS_SUCCESS = 'TXN_SUCCESS',
  TXN_STATUS_FAILURE = 'TXN_FAILURE',
}

export enum applicationTypeForTransaction {
  BLANK = '',
  PAN = 'PAN',
  DSC = 'DSC',
  GUMASTA = 'GUMASTA',
  ITR = 'ITR',
  MSME = 'MSME',
  DIGITAL_PAN = 'DIGITAL_PAN',
}

export enum transactionFor {
  SERVICE_PAYMENT = 'SERVICE_PAYMENT',
  DISTRIBUTOR_REGITRATION_PAYMENT = 'DISTRIBUTOR_REGITRATION_PAYMENT',
  SUBSCRIPTION_PLAN = 'SUBSCRIPTION_PLAN',
  DIGITAL_PAN_WALLET_RECHARGE = 'DIGITAL_PAN_WALLET_RECHARGE',
}
@Schema({ timestamps: true })
export class Transaction {
  @Prop({ default: '' })
  sjbtCode: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userType: string;

  @Prop({ required: true, enum: transactionFor })
  transactionFor: string;

  @Prop({
    default: [
      {
        applicationType: applicationTypeForTransaction.BLANK,
        applicationId: '',
        srn: '',
      },
    ],
    type: [
      {
        applicationType: String,
        applicationId: String,
        srn: String,
      },
    ],
  })
  applicationDetails: {
    applicationType: applicationTypeForTransaction;
    applicationId: string;
    srn: string;
  }[];

  @Prop({
    default: [
      {
        applicationType: applicationTypeForTransaction.BLANK,
        cartAppliationId: '',
      },
    ],
    type: [
      {
        applicationType: String,
        cartAppliationId: String,
      },
    ],
  })
  cartItemsApplicationIds: {
    applicationType: applicationTypeForTransaction;
    cartAppliationId: string;
  }[];

  @Prop({ default: '' })
  date: string;

  @Prop({ default: '' })
  txnId: string;

  @Prop({ default: paymentStatus.PENDING, enum: paymentStatus })
  paymentStatus: string;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  remark: string;

  @Prop({ required: true })
  serialNumber: number;

  @Prop({ default: '' })
  uniqueTransactionId: string;

  @Prop({ default: [], type: Array })
  reqData: object[];

  @Prop({ default: [], type: Array })
  resData: object[];
}

export type TransactionDocument = Transaction & Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
