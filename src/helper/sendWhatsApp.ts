/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from "@nestjs/common";
import * as http from "http";
import { InjectModel } from "@nestjs/mongoose";
import {
  WhatsappTemplate,
  WhatsappTemplateDocument,
} from "src/api/whatsapp-template/entities/whatsapp-template.entity";
import { Model } from "mongoose";
import {
  WhatsappLogs,
  WhatsappLogsDocument,
} from "../api/whatsapp-logs/entities/whatsapp-logs.entity";

@Injectable()
export class WhatsappMsgService {
  constructor(
    @InjectModel(WhatsappLogs.name)
    private readonly whatsappLogModel: Model<WhatsappLogsDocument>,
    @InjectModel(WhatsappTemplate.name)
    private WhatsappTemplateModel: Model<WhatsappTemplateDocument>
  ) {}

  async sendWhatsAppMsg91Function(
    mobileNumber,
    templateType,
    parameters,
    pdfUrl
  ) {
    /***get template***/
    try {
      let template = await this.getTemplate(templateType);
      let { templateName } = template.data;
      let data;
      if (pdfUrl) {
        data = {
          integrated_number: process.env.WHATSAPP_SENDER_NUMBER,
          content_type: "template",
          payload: {
            to: 91 + mobileNumber,
            type: "template",
            template: {
              name: templateName,
              language: {
                code: "en",
                policy: "deterministic",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "document",
                      document: {
                        link: pdfUrl,
                        filename: "acknowledge_pdf",
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: parameters,
                },
              ],
            },
            messaging_product: "whatsapp",
          },
        };
      } else {
        data = {
          integrated_number: process.env.WHATSAPP_SENDER_NUMBER,
          content_type: "template",
          payload: {
            to: 91 + mobileNumber,
            type: "template",
            template: {
              name: templateName,
              language: {
                code: "en",
                policy: "deterministic",
              },
              components: [
                {
                  type: "body",
                  parameters: parameters,
                },
              ],
            },
            messaging_product: "whatsapp",
          },
        };
      }

      const dataToSend = {
        sendStatus: false,
        response: null,
        error: false,
      };

      const options = {
        method: "POST",
        hostname: "api.msg91.com",
        path: "/api/v5/whatsapp/whatsapp-outbound-message/",
        headers: {
          authkey: process.env.WHATSAPP_AUTHKEY,
          "content-type": "application/json",
        },
      };

      const result = await new Promise(async function (resolve, reject) {
        const req = http.request(options, async function (res) {
          const chunks = [];

          let check = res.on("data", function (chunk) {
            chunks.push(chunk);
          });

          await res.on("end", async function () {
            const body = Buffer.concat(chunks);
            let resBody = body.toString();

            try {
              resBody = JSON.parse(resBody);

              let logData = {
                WhatsappTo: mobileNumber,
                msg: "",
                successResponse: [],
                failedResponse: [],
              };
              if (resBody["sendStatus"] == "success") {
                dataToSend.sendStatus = true;
                dataToSend.response = resBody;
                dataToSend.error = false;

                //*** addd logs  */
                logData["msg"] = "Msg send successfully.";
                logData["successResponse"] = resBody["data"];

                try {
                  // const addLog = await new this.whatsappLogModel({
                  //   ...logData,
                  // }).save();

                  resolve(dataToSend);
                } catch (error) {
                  console.log(error);
                  dataToSend.sendStatus = false;
                  dataToSend.response = null;
                  dataToSend.error = true;
                  resolve(dataToSend);
                }
              } else {
                //*** addd logs  */
                logData["msg"] = "Msg not sent.";
                logData["successResponse"] = resBody["data"];
                // const addLog = await new this.whatsappLogModel({
                //   ...logData,
                // }).save();

                dataToSend.sendStatus = false;
                dataToSend.response = resBody;
                dataToSend.error = true;
                resolve(dataToSend);
              }
            } catch (error) {
              console.log(error);
              dataToSend.sendStatus = false;
              dataToSend.response = null;
              dataToSend.error = true;
              resolve(dataToSend);
            }
          });
        });

        req.write(JSON.stringify(data));
        req.end();
      });

      return result;
    } catch (error) {
      console.error(error);
    }
  }

  async getTemplate(templateType) {
    try {
      let resTosend = { status: false, data: null };
      const template = await this.WhatsappTemplateModel.findOne({
        isDeleted: false,
        isActive: true,
        templateType: templateType,
      });
      if (!template) {
        console.log("template not found");
      }
      resTosend.status = true;
      resTosend.data = template;
      return resTosend;
    } catch (err) {
      console.log(err);
    }
  }
}
