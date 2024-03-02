import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum serviceType {
  PAN = 'PAN',
  DSC = 'DSC',
  GUMASTA = 'GUMASTA',
  ITR = 'ITR',
  MSME = 'MSME',
  DIGITAL_PAN = 'DIGITAL_PAN',
}

@Schema({ timestamps: true })
export class PriceConfig {
  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true, enum: serviceType })
  @IsEnum(serviceType)
  serviceType: serviceType;

  @Prop({ required: true })
  guestBaseprice: number;

  @Prop({ default: 0 })
  guestConvenienceprice: number;

  @Prop({ default: 0 })
  convenienceprice: number;

  @Prop({ required: true })
  price: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export type PriceConfigDocument = PriceConfig & Document;
export const PriceConfigSchema = SchemaFactory.createForClass(PriceConfig);
