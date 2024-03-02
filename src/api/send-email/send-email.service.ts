import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SendEmail, SendEmailDocument } from './entities/send-email.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { keyValidationCheck } from '../../helper/keysValidationCheck';
import { EmailService } from '../../helper/sendEmail';
import { smsTemplateService } from '../../helper/smsTemplates';

@Injectable()
export class SendEmailService {
  [x: string]: any;
  constructor(
    @InjectModel(SendEmail.name)
    private SendEmailModel: Model<SendEmailDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly EmailService: EmailService,
    private readonly smsTemplateService: smsTemplateService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new SendEmail
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const { to, cc, bcc, subject, emailBody, emailAttachment } = req.body;

      // let email_from = 'kumarsuyash94@gmail.com';

      // let data = {
      //   emailFrom: email_from,
      //   body: emailBody,
      //   emailSubject: subject,
      //   emailTo: to,
      //   emailAttachment: emailAttachment,
      // };

      // let sendEmail = await this.EmailService.sendEmail(req, data);

      const reqParams = ['to', 'cc', 'bcc', 'subject', 'emailBody'];

      const requiredKeys = ['to', 'subject', 'emailBody'];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys,
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: 'BAD_REQUEST',
          issue: 'REQUEST_BODY_VALIDATION_FAILED',
          data: null,
        });
      }

      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      // const emailData = {
      //   from: process.env.SMTP_EMAIL_ID,
      //   to: to,
      //   subject: subject,
      //   html: emailBody,
      // };

      let singnature =
        '<br><br>Thank You<br><br>Team EZY PAN GATEWAY<br><br>Disclaimer: This is a system generated email. Please do not reply to this email.<br><br><b>**This message is intended only for the person or entity to which it is addressed and may contain confidential and/or privileged information. if you have received this message in error, Please notify the sender immediately and delete this message from your message. **</b>';

      const sendEmailResult: any = await this.EmailService.sendEmail({
        emailFrom: process.env.SMTP_EMAIL_ID,
        body: emailBody + singnature,
        emailSubject: subject,
        emailTo: to,
        emailAttachment: false,
      });
      if (!sendEmailResult && !sendEmailResult.sendStatus) {
        throw new HttpException('Unable to send email.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'SEND_EMAIL',
        'SEND_EMAIL_ADD',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } sended email at ${currentDate}.`,
        'SendEmail added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Email send successfully.',
        status: true,
        //data: '',
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'SEND_EMAIL',
        'SEND_EMAIL_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to send email with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
