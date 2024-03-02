/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as nodemailer from "nodemailer";
import {
  EmailTemplate,
  EmailTemplateDocument,
} from "../api/email-templates/entities/email-template.module";
import {
  sendAttachmentTemplateVars,
  sendOtpTemplateVars,
  sendRefNoTemplateVars,
  sendRegistrationTemplateVars,
  sendRejectionTemplateVars,
  templates,
} from "../types/emailTemplateVarsTypes";
import * as SendGrid from "@sendgrid/mail";
import { response } from "express";
import {
  SendEmail,
  SendEmailDocument,
} from "src/api/send-email/entities/send-email.entity";
import * as path from "path";
import {
  EmailLogs,
  EmailLogsDocument,
} from "src/api/email-logs/entities/email-logs.entity";
import * as fs from "fs";
@Injectable()
export class EmailService {
  constructor(
    @InjectModel(EmailTemplate.name)
    private EmailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(EmailLogs.name)
    private EmailLogs: Model<EmailLogsDocument>
  ) {}
  // async sendEmail({ emailFrom, body, emailSubject, emailTo, emailAttachment }) {
  //   const from = emailFrom || process.env.SMTP_EMAIL_ID;
  //   const body_data = body;
  //   const subject = emailSubject;
  //   const to = emailTo;

  //   let attachments = [];
  //   if (
  //     emailAttachment &&
  //     emailAttachment !== undefined &&
  //     emailAttachment !== null &&
  //     emailAttachment.length
  //   ) {
  //     attachments = emailAttachment;
  //   }

  //   const transporter = await nodemailer.createTransport({
  //     host: process.env.SMTP_MAIL_HOST,
  //     port: 25,
  //     secure: false,
  //     auth: {
  //       user: process.env.SMTP_MAIL_USER,
  //       pass: process.env.SMTP_MAIL_PASSWORD,
  //     },
  //     debug: true,
  //   });

  //   const mailOptions = {
  //     from: from,
  //     to: to,
  //     subject: subject,
  //     html: body_data,
  //     attachments: attachments,
  //   };

  //   let dataToSend = {
  //     sendStatus: false,
  //     response: {},
  //     error: false,
  //   };

  //   const result = await new Promise(async function (resolve, reject) {
  //     const data = await transporter.sendMail(mailOptions, (error, info) => {
  //       if (!error && info.response.includes('250 Ok')) {
  //         dataToSend = {
  //           sendStatus: true,
  //           response: info,
  //           error: false,
  //         };
  //       } else if (error) {
  //         console.log(error);
  //         dataToSend = {
  //           sendStatus: false,
  //           response: {},
  //           error: true,
  //         };
  //       }
  //       resolve(dataToSend);
  //     });
  //   });
  //   return result;
  // }

  //function to get template

  /**send email through send grid */

  async sendEmail({ emailFrom, body, emailSubject, emailTo, emailAttachment }) {
    try {
      return new Promise(async (resolve, reject) => {
        let message = {
          to: emailTo,
          from: { name: process.env.FIRMNAME, email: emailFrom },
          subject: emailSubject,
          html: body,
          attachments: [], // Initialize attachments array
        };

        // Add attachments if provided
        if (emailAttachment) {
          const folderName = "ACKNOWLEDGEPDF";
          const new_file_path = path.join(
            __dirname,
            "../../",
            "public",
            "uploads",
            folderName
          );

          for (const attachment of emailAttachment) {
            const fileContent = await fs.readFileSync(attachment.content);

            const attachmentBase64 = fileContent.toString("base64");

            const attachmentData = {
              content: attachmentBase64,
              filename: attachment.filename,
              type: attachment.type,
              disposition: "attachment",
            };

            message.attachments.push(attachmentData);
          }
        }

        // Send the email
        let api_key = process.env.SEND_GRID_API_KEY;
        SendGrid.setApiKey(api_key);

        let successResponse = "Email not sent.";
        let failedResponse;

        try {
          await SendGrid.send(message);

          successResponse = "Email sent successfully.";
          resolve(true);
        } catch (error) {
          console.log("Failed to send email:", error);
          failedResponse = error.response
            ? error.response.body
              ? error.response.body.errors
                ? error.response.body.errors
                : error.response.body
              : [{ message: "Unable to get reason of failed response." }]
            : [{ message: "Unable to get reason of failed response." }];
          resolve(true);
        }

        let logData = {
          emailTo: emailTo,
          successResponse: successResponse,
          failedResponse: failedResponse,
        };

        try {
          const addLog = await new this.EmailLogs({ ...logData }).save();
        } catch (error) {
          console.log("Failed to save log:", error);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  getTemplate = async (templateType) => {
    const template = await this.EmailTemplateModel.findOne({
      isDeleted: false,
      isActive: true,
      templateName: templateType,
    });
    return template;
  };

  //function to complile name and otp
  compileSendOtpTemplate = async ({
    name,
    sjbtCode,
    otp,
  }: sendOtpTemplateVars) => {
    let resultData = await this.getTemplate(templates.SEND_OTP_TEMPLATE);
    if (!resultData) {
      return null;
    }
    const { templateData, templateSubject, emailFrom } = resultData;
    const compiledTemplate = templateData
      .replace("__NAME__", name)
      .replace("__SJBT_CODE__", sjbtCode)
      .replace("__OTP__", otp);
    return {
      template: compiledTemplate,
      emailFrom: emailFrom,
      subject: templateSubject,
    };
  };

  /**send otp through email template */
  sendEmailOTPTemplate = async (
    { name, sjbtCode, otp }: sendOtpTemplateVars,
    emailTo: string
  ) => {
    let resulData = await this.compileSendOtpTemplate({
      name,
      sjbtCode,
      otp,
    });
    if (!resulData) {
      return null;
    }
    const { template, emailFrom, subject } = resulData;
    return this.sendEmail({
      emailFrom,
      body: template,
      emailSubject: subject,
      emailTo,
      emailAttachment: false,
    });
  };

  //function to complile name and refNumber
  compilerefNoTemplate = async ({
    name,
    applicationType,
    refNo,
  }: sendRefNoTemplateVars) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_REFNO);
      const compiledTemplate = templateData
        .replace("__NAME__", name)
        .replace(/__APPLICATION_TYPE__/g, applicationType)
        .replace("__REFNO__", refNo);

      const compiledTemplateSubject = templateSubject
        .replace("__REFNO__", refNo)
        .replace("__APPLICATION_TYPE__", applicationType);
      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: compiledTemplateSubject,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send Reference number through email template */
  sendEmailRefNoTemplate = async (
    { applicationType, name, refNo }: sendRefNoTemplateVars,
    emailTo: string
  ) => {
    let resultData = await this.compilerefNoTemplate({
      name,
      applicationType,
      refNo,
    });
    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;
    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: false,
    });
  };

  //function to complile name and refNumber
  compileRejectionTemplate = async ({
    applicationType,
    name,
    rejectionMsg,
    refNo,
  }: sendRejectionTemplateVars) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_EMAIL_REJECTION_TEMPLATE);
      const compiledTemplate = templateData
        .replace("__APPLICATION_TYPE__", applicationType)
        .replace("__NAME__", name)
        .replace("__REJECTION_REASON__", rejectionMsg)
        .replace("__REFNO__", refNo);
      const compiledTemplateSubejct = templateSubject
        .replace("__REFNO__", refNo)
        .replace("__APPLICATION_TYPE__", applicationType);

      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: compiledTemplateSubejct,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send Reference number through email template */
  sendEmailRejectionTemplate = async (
    { applicationType, name, rejectionMsg, refNo }: sendRejectionTemplateVars,
    emailTo: string
  ) => {
    let resultData = await this.compileRejectionTemplate({
      applicationType,
      name,
      rejectionMsg,
      refNo,
    });
    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;
    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: false,
    });
  };

  //function to complile name and refNumber
  compileRegistrationTemplate = async ({
    name,
    sjbtCode,
  }: sendRegistrationTemplateVars) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_EMAIL_REGISTRATION_TEMPLATE);
      const compiledTemplate = templateData
        .replace("__NAME__", name)
        .replace("__SJBT_CODE__", sjbtCode);
      const compiledTemplateSubject = templateSubject.replace(
        "__SJBT_CODE__",
        sjbtCode
      );

      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: compiledTemplateSubject,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send srn when user registered through email template */
  sendEmailRegistrationTemplate = async (
    { name, sjbtCode }: sendRegistrationTemplateVars,
    emailTo: string
  ) => {
    let resultData = await this.compileRegistrationTemplate({
      name,
      sjbtCode,
    });
    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;

    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: false,
    });
  };

  //function to complile name and refNumber
  compileAcknowledmentTemplate = async ({
    applicationType,
    name,
    refNo,
  }: any) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_ACKOWLEDMENT_TEMPLATE);
      const compiledTemplate = templateData

        .replace("__NAME__", name)
        .replace("__REFNO__", refNo);

      const compiledTemplateSubject = templateSubject
        .replace("__APPLICATION_TYPE__", applicationType)
        .replace("__REFNO__", refNo);

      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: compiledTemplateSubject,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send srn when user registered through email template */
  sendAcknowledMentTemplate = async (
    { applicationType, name, refNo, emailAttachment }: any,
    emailTo: string
  ) => {
    let resultData = await this.compileAcknowledmentTemplate({
      applicationType,
      name,
      refNo,
    });

    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;
    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: emailAttachment,
    });
  };

  //function to complile name and refNumber
  compileAttachmentTemplate = async ({ name }: any) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_ATTACHMENT_TEMPLATE);
      const compiledTemplate = templateData.replace("__NAME__", name);

      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: templateSubject,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send srn when user registered through email template */
  sendAttachmentTemplate = async (
    { name, emailAttachment }: any,
    emailTo: string
  ) => {
    let resultData = await this.compileAttachmentTemplate({
      name,
    });
    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;

    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: emailAttachment,
    });
  };
  //function to complile name and refNumber
  compileResetPasswordTemplate = async ({ password }: any) => {
    try {
      const { templateData, templateSubject, emailFrom } =
        await this.getTemplate(templates.SEND_PASSWORD_TEMPLATE);

      const compiledTemplate = templateData.replace("__PASSWORD__", password);

      return {
        template: compiledTemplate,
        emailFrom: emailFrom,
        subject: templateSubject,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send srn when user registered through email template */
  sendResetPasswordTemplate = async (password: any, emailTo: string) => {
    let resultData = await this.compileResetPasswordTemplate({
      password,
    });

    if (!resultData) {
      return null;
    }
    const { template, emailFrom, subject } = resultData;

    return this.sendEmail({
      emailFrom: emailFrom,
      body: template,
      emailSubject: subject,
      emailTo: emailTo,
      emailAttachment: [],
    });
  };
}
