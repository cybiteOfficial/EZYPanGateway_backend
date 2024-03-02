import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isEnum } from 'class-validator';

export enum serviceType {
  PAN = 'PAN',
  DSC = 'DSC',
  GUMASTA = 'GUMASTA',
  ITR = 'ITR',
  MSME = 'MSME',
  DIGITAL_PAN = 'DIGITAL_PAN',
}

export enum adminType {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, lowercase: true, trim: true })
  userName: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  mobile: string;

  @Prop({ default: adminType.ADMIN, enum: adminType })
  role: adminType;

  @Prop({ required: true, trim: true })
  adminRoleGroupName: string;

  @Prop({ required: true })
  printWaitTime: number;

  @Prop({ required: true })
  maximumInprogressCount: number;

  @Prop({ required: true, type: Array })
  applicationStatusAccess: { applicationType: serviceType; status: string }[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type adminDocument = Admin & Document;
export const AdminSchema = SchemaFactory.createForClass(Admin);
