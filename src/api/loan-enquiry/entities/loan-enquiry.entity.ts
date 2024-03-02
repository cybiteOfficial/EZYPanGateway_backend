import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum employeeType {
  BLANK = '',
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF EMPLOYED',
  SELF_EMPLOYED_DR_CA = 'SELF EMPLOYED DR/CA',
  OTHERS = 'OTHERS',
}

export enum loanType {
  BLANK = '',
  HOME_LOAN = 'HOME LOAN',
  MORTGAGE_LOAN = 'MORTGAGE LOAN',
  PERSONAL_LOAN = 'PERSONAL LOAN',
  BUSINESS_LOAN = 'BUSINESS LOAN',
  OD_LIMIT = 'OD LIMIT',
  PROJECT_LOAN = 'PROJECT LOAN',
  MUNDRA_LOAN = 'MUNDRA LOAN',
}
@Schema({ timestamps: true })
export class LoanEnquiry {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  mobile: string;

  @Prop({ required: true })
  currentResidencePincode: number;

  @Prop({ required: true, enum: employeeType })
  employeeType: employeeType;

  @Prop({ required: true, enum: loanType })
  loanType: loanType;

  @Prop({ default: 0 })
  monthlySalary: number;

  @Prop({ default: '' })
  currentCompanyName: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type LoanEnquiryDocument = LoanEnquiry & Document;
export const LoanEnquirySchema = SchemaFactory.createForClass(LoanEnquiry);
