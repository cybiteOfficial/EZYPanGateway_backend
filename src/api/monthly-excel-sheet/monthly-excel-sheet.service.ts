import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import {
  PanApplication,
  PanDocument,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../digital-sign/entities/digital-sign.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  UserCommission,
  UserCommissionDocument,
} from "../userCommission/entities/user-commission.entity";
import * as ExcelJS from "exceljs";
import * as nodemailer from "nodemailer";
import { EmailService } from "../../helper/sendEmail";
import { sendMonthlySheetHelper } from "./monthly-excel-sheet.helper";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class monthExcelSheetService {
  [x: string]: any;
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PanApplication.name) private panAppModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private readonly itrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly msmeApplicationModel: Model<MsmeApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private readonly dscApplicationModel: Model<DigitalSignDocument>,
    @InjectModel(GumastaApplication.name)
    private readonly gumastaApplicationModel: Model<GumastaApplicationDocument>,
    @InjectModel(UserCommission.name)
    private readonly userCommissionModel: Model<UserCommissionDocument>,
    private readonly EmailService: EmailService,
    private readonly sendMonthlySheetHelper: sendMonthlySheetHelper
  ) {}

  //-------------------------------------------------------------------------
  /***
   * send monthly attachment
   */
  //-------------------------------------------------------------------------

  async sendExcelSheet(res, req) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const date = moment().format("MMDDYY");
      const currentMonth = moment().format("MMMM YYYY").toUpperCase();
      let distributors = await this.userModel.find({
        userType: Role.DISTRIBUTOR,
        isDeleted: false,
      });

      //query to get monthly applications
      const startOfMonth = new Date();
      startOfMonth.setDate(1); // Set the date to 1st of the current month
      startOfMonth.setHours(0, 0, 0, 0); // Set the time to the start of the day

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to the next month
      endOfMonth.setDate(0); // Set the date to the last day of the previous month
      endOfMonth.setHours(23, 59, 59, 999); // Set the time to the end of the day

      let query = {};

      //get pan application for each distributor
      let dataToBeInsert = [];
      for (let each in distributors) {
        let { _id } = distributors[each];
        let distributorName = distributors[each].name;
        let distributorEmailID = distributors[each].email;
        let distributorId = _id.toString();
        let distributorSjbtCode = distributors[each].sjbtCode;
        query = {
          distributorCode: distributorSjbtCode,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          isDeleted: false,
        };

        //get all application of distributor
        let allApplications =
          await this.sendMonthlySheetHelper.getAllApplications(query);

        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          allApplications: allApplications,
        });
        //get monthly subagent

        let monthlyretailers =
          await this.sendMonthlySheetHelper.getMonthlyRetailers();
        let retailerOfParticularDistributor = monthlyretailers.filter((el) => {
          return el.allDistributor.filter(
            (el) => el.sjbtCode === distributorSjbtCode
          );
        });

        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          retailerList: retailerOfParticularDistributor,
        });

        // monthly pan application list
        let panApplications =
          await this.sendMonthlySheetHelper.getMonthlyPanApplications(query);
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyPanApplications: panApplications,
        });

        // monthly itr application list
        let itrApplications =
          await this.sendMonthlySheetHelper.getMonthlyItrApplications(query);
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyItrApplications: itrApplications,
        });

        // monthly gumasta application list
        let gumastaApplications =
          await this.sendMonthlySheetHelper.getMonthlyGumastaApplications(
            query
          );
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyGumastaApplications: gumastaApplications,
        });

        // monthly dsc application list
        let dscApplications =
          await this.sendMonthlySheetHelper.getMonthlyDscApplications(query);
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyDscApplications: dscApplications,
        });

        // monthly msme application list
        let msmeApplications =
          await this.sendMonthlySheetHelper.getMonthlyMsmeApplications(query);
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyMsmeApplications: msmeApplications,
        });

        //-------------------------monthly-commission-list-----------//
        let distributorMonthlyCommision =
          await this.sendMonthlySheetHelper.distributorMonthlyCommission(
            distributorId
          );
        dataToBeInsert.push({
          distributorName: distributorName,
          distributorEmailID: distributorEmailID,
          distributorSjbtCode: distributorSjbtCode,
          monthlyCommision: [...distributorMonthlyCommision],
        });
      }
      // Group the data by distributor name
      const groupedData = dataToBeInsert.reduce((result, item) => {
        const distributorName = item.distributorName;
        if (!result[distributorName]) {
          result[distributorName] = {
            distributorName,
            retailerList: [],
            allApplications: [],
            monthlyItrApplications: [],
            monthlyGumastaApplications: [],
            monthlyDscApplications: [],
            monthlyPanApplications: [],
            monthlyMsmeApplications: [],
            monthlyCommision: [],
          };
        }

        result[distributorName] = {
          ...result[distributorName],
          ...item,
        };
        return result;
      }, {});

      const groupedArray = Object.values(groupedData);

      //---------------------create excel sheet for each distributor------------------//

      for (let each in groupedArray) {
        let distributorSjbtCode = groupedArray[each]["distributorSjbtCode"];
        let distributorEmailID = groupedArray[each]["distributorEmailID"];
        let distributorName = groupedArray[each]["distributorName"];
        let allApplications = groupedArray[each]["allApplications"];
        let retailerList = groupedArray[each]["retailerList"];
        let monthlyPanApplications =
          groupedArray[each]["monthlyPanApplications"];
        let monthlyMsmeApplications =
          groupedArray[each]["monthlyMsmeApplications"];
        let monthlyItrApplications =
          groupedArray[each]["monthlyItrApplications"];
        let monthlyGumastaApplications =
          groupedArray[each]["monthlyGumastaApplications"];
        let monthlyDscApplications =
          groupedArray[each]["monthlyDscApplications"];
        let monthlyCommision = groupedArray[each]["monthlyCommision"];
        const workbook = new ExcelJS.Workbook();
        // Create  sheet for monthly applications
        const worksheet1 = workbook.addWorksheet("Monthly Applications");

        // columns for the first sheet
        worksheet1.columns = [
          { header: "Date And Time", key: "date", width: 30 },
          { header: "Name", key: "name", width: 20 },
          { header: "Reference Number", key: "srn", width: 30 },
        ];

        // rows for monthly applications data

        allApplications.forEach((application) => {
          worksheet1.addRow({
            date: application.appliedOnDate,
            name: application.applicantName,
            srn: application.srn,
          });
        });

        //------------------------------------------------------

        // Create  sheet for monthly commissions
        const worksheet2 = workbook.addWorksheet(
          `Retailer list ${currentMonth}`
        );

        worksheet2.columns = [
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
        ];

        retailerList.forEach((retailer) => {
          worksheet2.addRow({
            sjbtCode: distributorSjbtCode,
            mobile: retailer.mobileNumber,
          });
        });

        // Create  monthly panApplications
        const worksheet3 = workbook.addWorksheet(`Pan list ${currentMonth}`);

        worksheet3.columns = [
          { header: "Datatime", key: "datetime", width: 30 },
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Email", key: "email", width: 30 },
          { header: "Name", key: "name", width: 30 },
          { header: "Ref.No.", key: "srn", width: 30 },
          { header: "Agent Mobile No.", key: "agentMobile", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "amount", key: "amount", width: 15 },
          { header: "status", key: "status", width: 30 },
        ];

        monthlyPanApplications.forEach((application) => {
          worksheet3.addRow({
            name: application.name,
            email: application.email,
            srn: application.srn,
            sjbtCode: application.distributorCode,
            mobile: application.mobileNumber,
            type: application.appliedByType,
            agentMobile: application.appliedByNumber,
            amount: application.applicationIndividualPrice,
            datetime: application.appliedOnDate,
            status: application.status,
          });
        });

        // Create  sheet for monthly ItrApplications
        const worksheet4 = workbook.addWorksheet(`ITR list ${currentMonth}`);

        worksheet4.columns = [
          { header: "Datatime", key: "datetime", width: 30 },
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Email", key: "email", width: 30 },
          { header: "Name", key: "name", width: 30 },
          { header: "Ref.No.", key: "srn", width: 30 },
          { header: "Agent Mobile No.", key: "agentMobile", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "amount", key: "amount", width: 15 },
          { header: "status", key: "status", width: 30 },
        ];

        monthlyItrApplications.forEach((application) => {
          worksheet4.addRow({
            name: application.name,
            email: application.email,
            srn: application.srn,
            sjbtCode: application.distributorCode,
            mobile: application.mobileNumber,
            type: application.appliedByType,
            agentMobile: application.appliedByNumber,
            amount: application.applicationIndividualPrice,
            datetime: application.appliedOnDate,
            status: application.status,
          });
        });

        // Create sheet for monthly MSME Applications
        const worksheet5 = workbook.addWorksheet(`MSME list ${currentMonth}`);

        worksheet5.columns = [
          { header: "Datatime", key: "datetime", width: 30 },
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Email", key: "email", width: 30 },
          { header: "Name", key: "name", width: 30 },
          { header: "Ref.No.", key: "srn", width: 30 },
          { header: "Agent Mobile No.", key: "agentMobile", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "amount", key: "amount", width: 15 },
          { header: "status", key: "status", width: 30 },
        ];

        monthlyMsmeApplications.forEach((application) => {
          worksheet5.addRow({
            name: application.name,
            email: application.email,
            srn: application.srn,
            sjbtCode: application.distributorCode,
            mobile: application.mobileNumber,
            agentMobile: application.appliedByNumber,
            type: application.appliedByType,
            amount: application.applicationIndividualPrice,
            datetime: application.appliedOnDate,
            status: application.status,
          });
        });

        // Create   sheet for monthly GUMASTA Applications
        const worksheet6 = workbook.addWorksheet(
          `GUMASTA list ${currentMonth}`
        );

        worksheet6.columns = [
          { header: "Datatime", key: "datetime", width: 30 },
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Email", key: "email", width: 30 },
          { header: "Name", key: "name", width: 30 },
          { header: "Ref.No.", key: "srn", width: 30 },
          { header: "Agent Mobile No.", key: "agentMobile", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "amount", key: "amount", width: 15 },
          { header: "status", key: "status", width: 30 },
        ];

        monthlyGumastaApplications.forEach((application) => {
          worksheet6.addRow({
            name: application.name,
            email: application.email,
            srn: application.srn,
            sjbtCode: application.distributorCode,
            mobile: application.mobileNumber,
            type: application.appliedByType,
            agentMobile: application.appliedByNumber,
            amount: application.applicationIndividualPrice,
            datetime: application.appliedOnDate,
            status: application.status,
          });
        });

        // Create   sheet for monthly DSC Applications
        const worksheet7 = workbook.addWorksheet(`DSC list ${currentMonth}`);

        worksheet7.columns = [
          { header: "Datatime", key: "datetime", width: 30 },
          { header: "SJBT CODE", key: "sjbtCode", width: 30 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Email", key: "email", width: 30 },
          { header: "Name", key: "name", width: 30 },
          { header: "Ref.No.", key: "srn", width: 30 },
          { header: "Agent Mobile No.", key: "agentMobile", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "amount", key: "amount", width: 15 },
          { header: "status", key: "status", width: 30 },
        ];

        monthlyDscApplications.forEach((application) => {
          worksheet7.addRow({
            name: application.name,
            email: application.email,
            srn: application.srn,
            sjbtCode: application.distributorCode,
            mobile: application.mobileNumber,
            agentMobile: application.appliedByNumber,
            type: application.appliedByType,
            amount: application.applicationIndividualPrice,
            datetime: application.appliedOnDate,
            status: application.status,
          });
        });

        // // Create heet for monthly commissions
        const worksheet8 = workbook.addWorksheet("Monthly Commissions");

        worksheet8.columns = [
          { header: "Mobile", key: "mobile", width: 30 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Commission For", key: "commissionFor", width: 15 },
        ];

        monthlyCommision.forEach((commission) => {
          worksheet8.addRow({
            mobile: commission.appliedByMobileNumber,
            amount: commission.amount,
            commissionFor: commission.commissionFor,
          });
        });

        // Generate the Excel file
        const folderName = "EXCEL-SHEET";
        const newFolderPath = path.join(
          __dirname,
          "../../../",
          "public",
          "uploads",
          folderName
        );

        const fileName = `EZY@${distributorName + date}.xlsx`;
        const filePath = path.join(newFolderPath, fileName);

        if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath, { recursive: true });
        }
        await workbook.xlsx.writeFile(filePath);
        console.log("Excel file created.");

        // Send the email with the Excel file as an attachment

        let attachments = [
          {
            content: filePath,
            filename: fileName,
          },
        ];

        let sendAttachments = await this.EmailService.sendAttachmentTemplate(
          {
            name: distributorName.toUpperCase(),
            emailAttachment: attachments,
          },
          "toshi.yadu9999@gmail.com"
          // distributorEmailID
        );
      }

      return res.status(200).send({
        message: "All ok",
        status: true,
        data: groupedArray,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * send monthly attachment
   */
  //-------------------------------------------------------------------------

  async sendUserCommissionSheet(res, req) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const date = moment().format("MMDDYY");
      const currentMonth = moment().format("MMMM YYYY").toUpperCase();
      let distributors = await this.userModel.find({
        userType: Role.DISTRIBUTOR,
        isDeleted: false,
      });

      //query to get monthly applications
      const startOfMonth = new Date();
      startOfMonth.setDate(1); // Set the date to 1st of the current month
      startOfMonth.setHours(0, 0, 0, 0); // Set the time to the start of the day

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to the next month
      endOfMonth.setDate(0); // Set the date to the last day of the previous month
      endOfMonth.setHours(23, 59, 59, 999); // Set the time to the end of the day

      let query = {};

      //get pan application for each distributor
      let dataToBeInsert = [];
      for (let each in distributors) {
        let { _id } = distributors[each];
        let distributorName = distributors[each].name;
        let distributorEmailID = distributors[each].email;
        let distributorId = _id.toString();
        let distributorSjbtCode = distributors[each].sjbtCode;
        query = {
          distributorCode: distributorSjbtCode,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          isDeleted: false,
        };

        //-------------------------monthly-commission-list-----------//
        let matchQuery = {
          commissionTransactionType: "CREDIT",
          appliedById: distributorId,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        };
        let distributorMonthlyCommision =
          await this.sendMonthlySheetHelper.distributorMonthlyCommission(
            matchQuery
          );

        let totalCommission = distributorMonthlyCommision.reduce((sum, el) => {
          return sum + el.amount;
        }, 0);

        let maxMonthlyCommission = 100;
        if (totalCommission > maxMonthlyCommission) {
          dataToBeInsert.push({
            distributorName: distributorName,
            distributorEmailID: distributorEmailID,
            distributorSjbtCode: distributorSjbtCode,
            monthlyCommision: [...distributorMonthlyCommision],
          });
        }
      }
      // Group the data by distributor name
      const groupedData = dataToBeInsert.reduce((result, item) => {
        const distributorName = item.distributorName;
        if (!result[distributorName]) {
          result[distributorName] = {
            distributorName,
            monthlyCommision: [],
          };
        }

        result[distributorName] = {
          ...result[distributorName],
          ...item,
        };
        return result;
      }, {});

      const groupedArray = Object.values(groupedData);

      //---------------------create excel sheet for each distributor------------------//

      const workbook = new ExcelJS.Workbook();

      for (let each in groupedArray) {
        let distributorSjbtCode = groupedArray[each]["distributorSjbtCode"];
        let distributorEmailID = groupedArray[each]["distributorEmailID"];
        let distributorName = groupedArray[each]["distributorName"];
        let monthlyCommision = groupedArray[each]["monthlyCommision"];

        const worksheet = workbook.addWorksheet(distributorName);

        worksheet.columns = [
          { header: "Mobile", key: "mobile", width: 30 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Commission For", key: "commissionFor", width: 15 },
        ];

        monthlyCommision.forEach((commission) => {
          worksheet.addRow({
            mobile: commission.appliedByMobileNumber,
            amount: commission.amount,
            commissionFor: commission.commissionFor,
          });
        });
      }

      // Generate the Excel file
      const folderName = "EXCEL-SHEET";
      const newFolderPath = path.join(
        __dirname,
        "../../../",
        "public",
        "uploads",
        folderName
      );
      const formattedDate = new Date().toISOString().replace(/:/g, "-");
      // const date = new Date().toISOString().slice(0, 10);
      const fileName = `EZY@${formattedDate}.xlsx`;
      const filePath = path.join(newFolderPath, fileName);
      if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath, { recursive: true });
      }
      // console.log(filePath, "filePath");
      // workbook.xlsx
      //   .writeFile(filePath)
      //   .then(async () => {
      //     console.log("Excel file created.");
      //     console.log(filePath);
      //     // Send the email with the Excel file as an attachment

      //     let attachments = [
      //       {
      //         content: filePath,
      //         filename: fileName,
      //       },
      //     ];

      //     // Replace the email recipient with the appropriate distributorEmailID
      //     let sendAttachments = await this.EmailService.sendAttachmentTemplate(
      //       {
      //         name: "Sir/Ma'am",
      //         emailAttachment: attachments,
      //       },
      //       "isha.ahirwar@codiotic.com"
      //       // distributorEmailID
      //     );
      //     console.log(sendAttachments, "sendAttachments");
      //   })
      //   .catch((error: any) => {
      //     console.error("Error creating Excel file:", error);
      //   });

      workbook.xlsx
        .writeFile(filePath)
        .then(() => {
          console.log("Excel file created.");

          // Construct the download URL with the local IP address
          const path_array = newFolderPath.split("public");
          let path = `${process.env.LOCAL}public${
            path_array[path_array.length - 1]
          }/${fileName}`;
          const downloadUrl = path;

          // Send the download URL as the response
          return res.status(200).send({
            message: "Excel file created.",
            downloadUrl: downloadUrl,
          });
        })
        .catch((error) => {
          console.error("Error creating Excel file:", error);
          return res.status(500).send("Error creating Excel file");
        });
      // return res.status(200).send({
      //   message: "All ok",
      //   status: true,
      //   data: groupedArray,
      //   code: "OK",
      //   issue: null,
      // });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
