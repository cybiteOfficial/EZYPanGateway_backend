/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as nodemailer from "nodemailer";
import axios, { AxiosRequestConfig } from "axios";
import * as request from "request";
import * as http from "http";

import {
  SmsTemplate,
  SmsTemplateDocument,
} from "../api/sms-templates/entities/sms-templates.entity";
import {
  SendRejectionMsgTemplateVars,
  SendSmsOtpTemplateVars,
  sendOtpTemplateVars,
  sendRefNoTemplateVars,
  smsTemplates,
} from "../types/smsTemplateVarsTypes";

@Injectable()
export class smsTemplateService {
  constructor(
    @InjectModel(SmsTemplate.name)
    private SmsTemplateModel: Model<SmsTemplateDocument>
  ) {}

  /**send sms helper */
  async sendMessage(data) {
    let { template, mobileNo, senderId, templateId } = data;
    const message = encodeURIComponent(template);

    const authKey = process.env.SMS_CLUSTER_AUTH_KEY;
    const url = `http://api.msg91.com/api/v2/sendsms/sendGroupSms?AUTH_KEY=${authKey}&message=${message}&senderId=${senderId}&routeId=1&mobileNos=${mobileNo}&smsContentType=english&DLT_TE_ID=${templateId}`;
    try {
      const response = await axios.get(url);

      return true;
    } catch (error) {
      // Handle error
      console.error("Error sending SMS:", error.message);
      return false;
    }
  }

  //function to get template
  getTemplate = async (templateType) => {
    const template = await this.SmsTemplateModel.findOne({
      isDeleted: false,
      isActive: true,
      templateName: templateType,
    });
    if (!template) {
      return null;
    }
    return template;
  };

  //function to complile name ,appllication type and refNo
  compileSendRefNoTemplate = async (vars: sendRefNoTemplateVars) => {
    try {
      const { template, templateId, senderId, templateName } =
        await this.getTemplate(smsTemplates.SMS_REFNO_TEMPLATE);
      const compiledTemplate = template
        .replace("##refno##", vars.refNo)
        .replace("##name##", vars.name)
        .replace("##application##", vars.applicationType);
      return {
        template: compiledTemplate,
        templateId: templateId,
        senderId: senderId,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send reference number template */
  SendRefNoTemplate = async (mobileNo: any, vars: sendRefNoTemplateVars) => {
    const { template, templateId, senderId } =
      await this.compileSendRefNoTemplate(vars);

    let data = {
      template: template,
      mobileNo: mobileNo,
      senderId: senderId,
      templateId: templateId,
    };
    return this.sendMessage(data);
  };

  //function to compile otp
  compileSendOtpTemplate = async (vars: SendSmsOtpTemplateVars) => {
    try {
      const { template, templateId, senderId, templateName } =
        await this.getTemplate(smsTemplates.SMS_OTP_TEMPLATE);
      const compiledTemplate = template.replace("##otp##", vars.otp);
      // .replace('##name##', vars.name);
      return {
        template: compiledTemplate,
        templateId: templateId,
        senderId: senderId,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send otp template */
  SendOtpTemplate = async (mobileNo: any, vars: SendSmsOtpTemplateVars) => {
    const { template, templateId, senderId } =
      await this.compileSendOtpTemplate(vars);
    let data = {
      template: template,
      mobileNo: mobileNo,
      senderId: senderId,
      templateId: templateId,
    };
    return this.sendMessage(data);
  };

  //function to compile rejection message
  compileSendRejectionMsgTemplate = async (
    vars: SendRejectionMsgTemplateVars
  ) => {
    try {
      const { template, templateId, senderId, templateName } =
        await this.getTemplate(smsTemplates.SMS_REJECTION_TEMPLATE);
      const compiledTemplate = template
        .replace("##name##", vars.name)
        .replace("##applicationType##", vars.applicationType)
        .replace("##rejctionMsg##", vars.rejctionMsg)
        .replace("##sjbtContactNo##", vars.sjbtContactNo);

      return {
        template: compiledTemplate,
        templateId: templateId,
        senderId: senderId,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  /**send rejection msg template */
  SendRejectionMsgTemplate = async (
    mobileNo: any,
    vars: SendRejectionMsgTemplateVars
  ) => {
    const { template, templateId, senderId } =
      await this.compileSendRejectionMsgTemplate(vars);
    let data = {
      template: template,
      mobileNo: mobileNo,
      senderId: senderId,
      templateId: templateId,
    };
    return this.sendMessage(data);
  };
}
