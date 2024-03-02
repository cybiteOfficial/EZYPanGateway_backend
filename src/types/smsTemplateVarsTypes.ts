export interface sendOtpTemplateVars {
  name: string;
  otp: string;
}

export enum templates {
  SEND_OTP_TEMPLATE = 'SEND_OTP_TEMPLATE',
  SEND_REFNO = 'SEND_REFNO_TEMPLATE',
}

export interface sendRefNoTemplateVars {
  name: string;
  applicationType: string;
  refNo: string;
}

export interface SendSmsOtpTemplateVars {
  otp: string;
}

export interface SendRejectionMsgTemplateVars {
  name: string;
  applicationType: string;
  rejctionMsg: string;
  sjbtContactNo: string;
}
export enum smsTemplates {
  SMS_OTP_TEMPLATE = 'SMS_OTP_TEMPLATE',
  SMS_REFNO_TEMPLATE = 'SMS_REFNO_TEMPLATE',
  SMS_REJECTION_TEMPLATE = 'SMS_REJECTION_TEMPLATE',
}
