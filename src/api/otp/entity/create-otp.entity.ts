/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum ValidOtp {
  EMAIL = 'EMAIL',
  MOBILE = 'MOBILE',
}
@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userType: string;

  @Prop({ default: '' })
  emailOTP: string;

  @Prop({ required: true })
  expiresIn: string;

  @Prop({ default: '' })
  mobileOTP: string;

  @Prop({ default: false })
  isOtpUsed: boolean;

  @Prop({ required: true, enum: ValidOtp })
  otpType: string;
}

export type OtpDocument = Otp & Document;
export const OtpSchema = SchemaFactory.createForClass(Otp);
