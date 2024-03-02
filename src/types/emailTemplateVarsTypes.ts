export interface sendOtpTemplateVars {
  name: string;
  sjbtCode: string;
  otp: string;
}

export enum templates {
  SEND_OTP_TEMPLATE = "SEND_OTP_TEMPLATE",
  SEND_REFNO = "SEND_REFNO_TEMPLATE",
  SEND_EMAIL_REJECTION_TEMPLATE = "SEND_EMAIL_REJECTION_TEMPLATE",
  SEND_EMAIL_REGISTRATION_TEMPLATE = "SEND_EMAIL_REGISTRATION_TEMPLATE",
  SEND_ACKOWLEDMENT_TEMPLATE = "SEND_ACKOWLEDMENT_TEMPLATE",
  SEND_ATTACHMENT_TEMPLATE = "SEND_ATTACHMENT_TEMPLATE",
  SEND_PASSWORD_TEMPLATE = "SEND_PASSWORD_TEMPLATE",
}

export interface sendRefNoTemplateVars {
  name: string;
  applicationType: string;
  refNo: string;
}

export interface sendRejectionTemplateVars {
  applicationType: string;
  name: string;
  rejectionMsg: string;
  refNo: string;
}

export interface sendRegistrationTemplateVars {
  name: string;
  sjbtCode: string;
}

export interface sendAttachmentTemplateVars {
  applicationType: string;
  name: string;
  refNo: string;
  emailAttachment: [
    {
      content: String;
      filename: String;
    }
  ];
}

export interface SendSmsOtpTemplateVars {
  otp: string;
}
export enum smsTemplates {
  SMS_OTP_TEMPLATE = "SMS_OTP_TEMPLATE",
  SMS_REFNO_TEMPLATE = "SMS_REFNO_TEMPLATE",
}
