import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "./../msme-application/entities/msme-application.entity";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "../user/entities/user.entity";
import { Cron } from "@nestjs/schedule";
import { PanApplication, PanDocument, status } from "./entities/pan.entity";
import * as fs from "fs";
import * as moment from "moment";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import { DigitalSign } from "../digital-sign/entities/digital-sign.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
const fsPromises = require("fs").promises;

@Injectable()
export class panCronJobService {
  [x: string]: any;
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(PanApplication.name)
    private readonly panApplicationModel: Model<PanDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly msmeApplicationModel: Model<MsmeApplicationDocument>,
    @InjectModel(ItrApplication.name)
    private readonly itrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private readonly digitalSignModel: Model<ItrApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private readonly gumastaApplicationModel: Model<GumastaApplicationDocument>
  ) {}

  //-------------------------------------------------------------------------
  /***
   * verify signature
   */
  //-------------------------------------------------------------------------
  // @Cron("*/5 * * * *") // Runs every five  minute
  @Cron("0 0 * * *") // Runs every day
  async deleteOlderFiles() {
    try {
      console.log("cron running to delete older files...");
      let threeMonthsAgo = moment().subtract(3, "months");

      let query = {
        verifiedOnDate: {
          $lt: threeMonthsAgo.format("YYYY-MM-DD HH:mm:ss"),
        },
      };
      let getPanApplicationsthreeMonthsOlder =
        await this.panApplicationModel.find(
          {
            ...query,
          },
          {
            panCardFront: 1,
            passportPhotoUrl: 1,
            signaturePhotoUrl: 1,
            panFormFrontPhotoUrl: 1,
            panFormBackPhotoUrl: 1,
            adhaarFrontPhotoUrl: 1,
            adhaarBackPhotoUrl: 1,
            otherDocuments: 1,
          }
        );
      if (getPanApplicationsthreeMonthsOlder.length) {
        await this.deleteFiles(getPanApplicationsthreeMonthsOlder)
          .then((updatedData) => {
            console.log(
              "Files deleted successfully:",
              JSON.stringify(updatedData)
            );
          })
          .catch((error) => {
            console.log("Error deleting files:", error);
          });
      }
      let getItrApplicationsthreeMonthsOlder =
        await this.itrApplicationModel.find(
          {
            ...query,
          },
          {
            acknowledgementPdf: 1,
            adhaarFrontPhotoUrl: 1,
            adhaarBackPhotoUrl: 1,
            panCardPhotoUrl: 1,
            banPassbookPhotoUrl: 1,
            otherDocuments: 1,
          }
        );
      if (getItrApplicationsthreeMonthsOlder.length) {
        await this.deleteFiles(getItrApplicationsthreeMonthsOlder)
          .then((updatedData) => {
            console.log(
              "Files deleted successfully:",
              JSON.stringify(updatedData)
            );
          })
          .catch((error) => {
            console.log("Error deleting files:", error);
          });
      }
      let getDscApplicationsthreeMonthsOlder = await this.digitalSignModel.find(
        {
          ...query,
        },
        {
          photoUrl: 1,
          adhaarCardPhotoUrl: 1,
          panCardPhotoUrl: 1,
          otherDocuments: 1,
          acknowledgementPdf: 1,
        }
      );
      if (getDscApplicationsthreeMonthsOlder.length) {
        await this.deleteFiles(getDscApplicationsthreeMonthsOlder)
          .then((updatedData) => {
            console.log(
              "Files deleted successfully:",
              JSON.stringify(updatedData)
            );
          })
          .catch((error) => {
            console.log("Error deleting files:", error);
          });
      }
      let getGumastaApplicationsthreeMonthsOlder =
        await this.gumastaApplicationModel.find(
          {
            ...query,
          },
          {
            acknowledgementPdf: 1,
            propritorPhotoUrl: 1,
            adhaarPhotoUrl: 1,
            shopOfficePhotoUrl: 1,
            addressProofPhotoUrl: 1,
            otherDocuments: 1,
          }
        );

      if (getGumastaApplicationsthreeMonthsOlder.length) {
        await this.deleteFiles(getGumastaApplicationsthreeMonthsOlder)
          .then((updatedData) => {
            console.log(
              "Files deleted successfully:",
              JSON.stringify(updatedData)
            );
          })
          .catch((error) => {
            console.log("Error deleting files:", error);
          });
      }
      let getmsmeApplicationsthreeMonthsOlder =
        await this.msmeApplicationModel.find(
          {
            ...query,
          },
          {
            photoUrl: 1,
            adhaarCardPhotoUrl: 1,
            panCardPhotoUrl: 1,
            otherDocuments: 1,
            acknowledgementPdf: 1,
          }
        );

      if (getmsmeApplicationsthreeMonthsOlder.length) {
        await this.deleteFiles(getmsmeApplicationsthreeMonthsOlder)
          .then((updatedData) => {
            console.log(
              "Files deleted successfully:",
              JSON.stringify(updatedData)
            );
          })
          .catch((error) => {
            console.log("Error deleting files:", error);
          });
      }
    } catch (err) {
      console.log(err);
    }
  }
  async deleteFiles(getPanApplicationsthreeMonthsOlder) {
    let application = getPanApplicationsthreeMonthsOlder;

    for (const document of application) {
      for (const key of Object.keys(document)) {
        const value = document[key];

        if (typeof value === "string" && value !== "") {
          try {
            await fs.unlink(value, (err) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log("File deleted successfully");
            });
          } catch (error) {
            console.log("Error occurred while deleting file:", error);
          }
        }
        if (Array.isArray(value) && value.length > 0) {
          for (const doc of value) {
            for (const innerKey of Object.keys(doc)) {
              const innerValue = doc[innerKey];
              if (typeof innerValue === "string" && innerValue !== "") {
                try {
                  // Replace backslashes with forward slashes for better compatibility
                  await fs.unlink(innerValue, (err) => {
                    if (err) {
                      console.error(err);
                      return;
                    }
                    console.log("File deleted successfully");
                  });
                } catch (error) {
                  console.log("Error occurred while deleting file:", error);
                }
              }
            }
          }
        }
      }
    }
    return getPanApplicationsthreeMonthsOlder;
  }
}
