/* eslint-disable prefer-const */
import {
  PanApplicationFlow,
  PanApplicationFlowDocument,
  status,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  Injectable,
  HttpException,
  HttpStatus,
  Redirect,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  applicationTypes,
  PanApplication,
  PanDocument,
  formCategory,
  paymentCategories,
  flowStatus,
} from "./entities/pan.entity";
import mongoose, { Model } from "mongoose";
import {
  RejectionList,
  RejectionListDocument,
} from "../rejection-list/entities/rejection-list.entity";
import {
  changestatusForApp,
  getApplicationCounts,
} from "../../helper/changeStatus";
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import { extractFieldsForPanFlowTable } from "../../helper/createNewEntryOfAppInFlow";
import { generateSRN } from "../../helper/otpGenerate.helper";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { User, UserDocument, VerifyStatus } from "../user/entities/user.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import { PanHelper } from "./pan.helper";
import { Role } from "../user-flow/entities/user-flow.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import { TransactionService } from "../transaction/transaction.service";
import {
  paymentStatus,
  transactionFor,
} from "../transaction/entities/transaction.entity";
import { adminHelper } from "../admin/admin.helper";
import { postApplication } from "../../helper/postApplication";
import { userAuthHelper } from "../../auth/auth.helper";
import { fieldsToBeUpdate } from "../../helper/fieldsToUpdate";
import { statusWiseApplications } from "../../helper/statusWiseApplications";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { paytmFunctions } from "../../helper/payment-gateway";
import {
  Transaction,
  TransactionDocument,
  paytmStatus,
} from "../transaction/entities/transaction.entity";
import { EmailService } from "../../helper/sendEmail";
import { smsTemplateService } from "../../helper/smsTemplates";
import { sendMsg91Function } from "../../helper/smsSend.helper";

/***/
import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import * as axios from "axios";
import {
  ZipFile,
  ZipFileDocument,
} from "../create-zip/entities/create-zip.entity";
import { WhatsappMsgService } from "../../helper/sendWhatsApp";

/***/

@Injectable()
export class PanAppServices {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name) private AdminModel: Model<adminDocument>,
    @InjectModel(PanApplication.name) private panAppModel: Model<PanDocument>,
    @InjectModel(PanApplicationFlow.name)
    private readonly PanAppFlowModel: Model<PanApplicationFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly TransactionService: TransactionService,
    private readonly adminHelper: adminHelper,
    private readonly panHelper: PanHelper,
    private readonly WhatsappMsgService: WhatsappMsgService,
    @InjectModel(RejectionList.name)
    private readonly RejectionModel: Model<RejectionListDocument>,
    @InjectModel(Transaction.name)
    private readonly TransactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ZipFile.name)
    private readonly ZipFileModel: Model<ZipFileDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    private readonly postApplication: postApplication,
    private readonly userAuthHelper: userAuthHelper,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly paytmFunctions: paytmFunctions,
    private readonly EmailService: EmailService,
    private readonly smsTemplateService: smsTemplateService
  ) {}
  //------------------------------------------------------------------------

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        category,
        title,
        name,
        dob,
        email,
        parentName,
        parentType,
        adhaarNumber,
        mobileNumber,
        panCardFront,
        passportPhotoUrl,
        signaturePhotoUrl,
        panFormFrontPhotoUrl,
        panFormBackPhotoUrl,
        adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl,
        panNumber,
        acknowledgementNumber,
        comments,
        appliedFrom,
        IsAgreedToTermsAndConditions,
        otherDocuments,
        paymentCategory,
        version,
        isRewardApplied,
        isRefundApplied,
      } = req.body;

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      /**
       * validat request body data and return object of valid req.body
       */

      const isDataValid = await this.panHelper.panApplicationValidations(req);
      if (!isDataValid.status) {
        return res.status(isDataValid.statusCode).send({ ...isDataValid.data });
      }

      //get full address ofuser
      let fullAddress = await this.panHelper.getCurrentAddressOfUser(
        req.userData.Id
      );

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();
      const dataToBeInsert = {
        appliedByUserCurrentAddress: fullAddress,
        srn: generateSRN(serviceType.PAN),
        uniqueTransactionId: uniqueTransactionId,
        rewardWalletAmountApplied: 0,
        refundWalletAmountApplied: 0,
        ...isDataValid.data,
      };

      const priceConfigs = await this.panHelper.getAmount(
        dataToBeInsert.appliedAsType,
        dataToBeInsert.paymentCategory
      );

      if (!priceConfigs.status) {
        throw new HttpException(
          "Unable to calculate payment. Please try again.",
          HttpStatus.OK
        );
      }

      /**
       * get price function will be here
       * total of below
       * service base price
       * convinience charges
       * categories price
       */
      let {
        totalAmount,
        convinienceCharges,
        mainCategoryPrice,
        basePrice,
        additionalCat2,
        additionalCat3,
        baseCatAppied,
      } = priceConfigs.data;

      if (baseCatAppied == paymentCategories.CAT_DSA) {
        let user = await this.panHelper.getAppliedUser(req.userData.Id);

        if (user !== null && user.pincode == "") {
          throw new HttpException(
            "Please update your profile address to apply for category DSA.",
            HttpStatus.OK
          );
        }
      }

      let updateRefundWallet = 0;
      let updateRewardWallet = 0;
      let isRefundToBeUpdate = false;
      let isRewardToBeUpdate = false;
      let walletUsed = 0;

      /**
       * get refund wallet discount amount function call
       *  use refundwallets and refundwallettransactions
       */

      if (isRefundApplied) {
        let isRefundExist = await this.panHelper.getRefundAmount(requestedId);
        let remainingAmount = totalAmount;

        if (isRefundExist.status) {
          if (totalAmount > isRefundExist.data.refundAmount) {
            walletUsed = isRefundExist.data.refundAmount;
            updateRefundWallet = 0;
            isRefundToBeUpdate = true;
            remainingAmount = totalAmount - isRefundExist.data.refundAmount;
          } else {
            walletUsed = totalAmount;
            remainingAmount = 0;
            isRefundToBeUpdate = true;
            updateRefundWallet = isRefundExist.data.refundAmount - totalAmount;
          }
        }

        totalAmount = remainingAmount;
        dataToBeInsert["refundWalletAmountApplied"] = walletUsed;
      }

      /**
       * get reward wallet discount amount function call
       * use userandservicewiserewardconfigs userrewardwallets
       */

      if (isRewardApplied) {
        let isRewardExist = await this.panHelper.getRewardAmount(requestedId);
        let remainingAmount = totalAmount;

        if (isRewardExist.status) {
          if (totalAmount > isRewardExist.data.rewardAmount) {
            walletUsed = isRewardExist.data.rewardAmount;
            updateRewardWallet = walletUsed - isRewardExist.data.rewardAmount;
            remainingAmount = totalAmount - isRewardExist.data.rewardAmount;
          } else {
            walletUsed = totalAmount;
            remainingAmount = 0;
            updateRewardWallet = isRewardExist.data.rewardAmount - totalAmount;
          }
          isRewardToBeUpdate = true;
        }

        totalAmount = remainingAmount;
        dataToBeInsert["rewardWalletAmountApplied"] = walletUsed;
      }

      dataToBeInsert["totalPrice"] = parseFloat(totalAmount.toString()).toFixed(
        2
      );

      dataToBeInsert["applicationIndividualPrice"] =
        totalAmount +
        dataToBeInsert.rewardWalletAmountApplied +
        dataToBeInsert.refundWalletAmountApplied;
      dataToBeInsert["convinienceCharges"] = convinienceCharges;
      dataToBeInsert["mainCategoryPrice"] = mainCategoryPrice;
      dataToBeInsert["additionalCat2"] = additionalCat2;
      dataToBeInsert["additionalCat3"] = additionalCat3;
      dataToBeInsert["basePrice"] = basePrice;
      dataToBeInsert["baseCatAppied"] = baseCatAppied;
      let redirectToPaymentGateway = totalAmount > 0 ? true : false;
      let statusOfPayment =
        totalAmount > 0 ? paymentStatus.PENDING : paymentStatus.SUCCESS;
      dataToBeInsert["txnStatus"] = statusOfPayment;
      dataToBeInsert["status"] = redirectToPaymentGateway
        ? status.BLANK
        : status.PENDING;

      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      const dataCreated = await new this.panAppModel({
        ...dataToBeInsert,
      }).save();

      if (!dataCreated) {
        throw new HttpException(
          "Unable to add pan application.",
          HttpStatus.OK
        );
      }
      const transactionDataToBeAdded = {
        _id: dataToBeInsert.txnObjectId,
        txnId: "",
        serialNumber: serialNumber,
        uniqueTransactionId,
        sjbtCode: dataToBeInsert.distributorCode,
        userId: dataToBeInsert.appliedById,
        userType: dataToBeInsert.appliedAsType,
        applicationDetails: [
          {
            applicationId: dataCreated._id,
            applicationType: serviceType.PAN,
            srn: dataToBeInsert.srn,
          },
        ],
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: dataToBeInsert["totalPrice"],
        remark: `Transaction created for PAN application having SRN ${
          dataToBeInsert.srn
        } on ${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")} `,
        reqData: [],
        resData: [],
      };

      if (redirectToPaymentGateway) {
        const paymentInitializeResponse: any =
          await this.paytmFunctions.initiatePayment({
            userId: req.userData.Id,
            totalAmount: dataToBeInsert["totalPrice"],
            email,
            uniqueTransactionId,
            mobileNumber,
            appliedFrom,
          });

        if (
          !paymentInitializeResponse["status"] ||
          paymentInitializeResponse["data"] === null
        ) {
          throw new HttpException(
            "Something went wrong. Unable to open payment gateway. Please try again.",
            HttpStatus.OK
          );
        }

        const { reqData, resData, orderId, txnToken, txnAmount, txnStatus } =
          paymentInitializeResponse["data"];
        transactionDataToBeAdded.reqData = reqData;
        transactionDataToBeAdded.resData = resData;
        resDataToSend.paymentGatewayData["orderId"] = orderId;
        resDataToSend.paymentGatewayData["token"] = txnToken;
        resDataToSend.paymentGatewayData["amount"] = txnAmount;
        resDataToSend.paymentGatewayData["tokenType"] = "TXN_TOKEN";
      } else {
        resDataToSend.paymentGatewayData["orderId"] = uniqueTransactionId;
        resDataToSend.paymentGatewayData["token"] = null;
        resDataToSend.paymentGatewayData["amount"] =
          dataToBeInsert["totalPrice"];
        resDataToSend.paymentGatewayData["tokenType"] = null;

        //-------------send refrence number to phone number-------------//
        let msg91Data = {
          template_id: process.env.MSG91_PAN_REGISTRATION_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID,
          short_url: "0",
          mobiles: "+91" + req.userData.contactNumber,
          name: dataCreated.name.toUpperCase(),
          refno: dataCreated.srn,
        };
        const msgSent: any = await sendMsg91Function(msg91Data);

        if (!msgSent || !msgSent.sendStatus) {
          console.log(msgSent.sendStatus);
        }

        //-------------send refrence number to email Id-------------//
        let emailId =
          requestedType === Role.GUEST
            ? req.body.email
            : req.userData.userEmail;
        let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
          {
            applicationType: serviceType.PAN,
            name: dataCreated.name.toUpperCase(),
            refNo: dataToBeInsert.srn,
          },
          emailId
        );
        if (!sendEmailRefNo) {
          console.log("email not sent");
        }
      }
      const transactionCreated =
        await this.TransactionService.createTransaction(
          transactionDataToBeAdded
        );

      if (!transactionCreated || !transactionCreated.status) {
        const deleteApplication = await this.panAppModel.findOneAndDelete({
          uniqueTransactionId: uniqueTransactionId,
        });
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_ADD",
          req.userData.mobileNumber,
          true,
          200,
          `${requestedType}${req.userData?.contactNumber || ""} applied for ${
            dataCreated.applicationType
          } PAN application at ${currentDate}.`,
          "PAN application applied successfully.",
          req.socket.remoteAddress
        );

        throw new HttpException(
          "Unable to initiate transaction. Please try again.",
          HttpStatus.OK
        );
      }

      const panadd = await extractFieldsForPanFlowTable(dataCreated);
      const updatedPanFlow = await new this.PanAppFlowModel({
        panApplicationId: dataCreated._id,
        ...panadd,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_ADD",
        dataCreated._id,
        true,
        200,
        `${requestedType}${req.userData?.contactNumber || ""} applied for ${
          serviceType.PAN
        } PAN application at ${currentDate}.`,
        "PAN application applied successfully.",
        req.socket.remoteAddress
      );

      /**
       * call post application function to update refund , reward wallet,
       */

      if (isRefundToBeUpdate === true) {
        const refundWalletUpdate =
          await this.postApplication.updateRefundWalletForCart(
            dataToBeInsert["refundWalletAmountApplied"],
            updateRefundWallet,
            req.userData.Id,
            serviceType.PAN,
            dataCreated._id,
            req.userData.type,
            uniqueTransactionId,
            req,
            dataToBeInsert.srn
          );
      }

      if (
        // dataCreated.appliedAsType !== Role.GUEST &&
        // dataCreated.appliedByType !== Role.GUEST &&
        isRewardToBeUpdate === true
      ) {
        const rewardWalletUpdate =
          await this.postApplication.updateRewardWalletForCart(
            dataToBeInsert["rewardWalletAmountApplied"],
            updateRewardWallet,
            req.userData.Id,
            serviceType.PAN,
            dataCreated._id,
            dataCreated.srn,
            uniqueTransactionId,
            req
          );
      }

      return res.status(200).send({
        message: "PAN application saved successfully.",
        status: true,
        data: resDataToSend,
        code: "CREATED",
        issue: null,
      });
      // res.redirect( process.env.TXN_SUCCESS_REDIRECT_URL );
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_ADD",
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to add PAN application with this ${req.userData.mobileNumber}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------
  async retryPaymnet(srn, res, req) {
    try {
      let { isRefundApplied, isRewardApplied, appliedFrom } = req.body;
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let applicationFound = await this.panAppModel.findOne({
        isDeleted: false,
        srn: srn,
        status: status.BLANK,
      });

      if (!applicationFound) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();
      let applicationDataToUpdate = {
        uniqueTransactionId: uniqueTransactionId,
        serialNumber: serialNumber,
      };
      let applicationApplyOnDate = applicationFound["createdAt"];
      const daysValid = 7;
      const applicationCreatedDate = moment(applicationApplyOnDate);
      const diffInDays = moment().diff(applicationCreatedDate, "days");
      if (diffInDays > daysValid) {
        throw new HttpException(
          "Retry payment validity expired.",
          HttpStatus.OK
        );
      }

      let totalAmount = 0;
      let updateRefundWallet = 0;
      let updateRewardWallet = 0;
      let isRefundToBeUpdate = false;
      let isRewardToBeUpdate = false;
      let walletUsed = 0;

      /**
       * get refund wallet discount amount function call
       *  use refundwallets and refundwallettransactions
       */
      totalAmount = applicationFound.applicationIndividualPrice;
      if (isRefundApplied) {
        let isRefundExist = await this.panHelper.getRefundAmount(requestedId);

        let remainingAmount = totalAmount;

        if (isRefundExist.status) {
          if (totalAmount > isRefundExist.data.refundAmount) {
            walletUsed = isRefundExist.data.refundAmount;
            updateRefundWallet = 0;
            remainingAmount = totalAmount - isRefundExist.data.refundAmount;
          } else {
            walletUsed = totalAmount;
            remainingAmount = 0;
            updateRefundWallet = isRefundExist.data.refundAmount - totalAmount;
          }
          isRefundToBeUpdate = true;
        }

        totalAmount = remainingAmount;
        applicationDataToUpdate["refundWalletAmountApplied"] = walletUsed;
      }

      /**
       * get reward wallet discount amount function call
       * use userandservicewiserewardconfigs userrewardwallets
       */

      if (isRewardApplied) {
        let isRewardExist = await this.panHelper.getRewardAmount(requestedId);
        let remainingAmount = totalAmount;

        if (isRewardExist.status) {
          if (totalAmount > isRewardExist.data.rewardAmount) {
            walletUsed = isRewardExist.data.rewardAmount;
            updateRewardWallet = walletUsed - isRewardExist.data.rewardAmount;
            remainingAmount = totalAmount - isRewardExist.data.rewardAmount;
          } else {
            walletUsed = totalAmount;
            remainingAmount = 0;
            updateRewardWallet = isRewardExist.data.rewardAmount - totalAmount;
          }
          isRewardToBeUpdate = true;
        }

        totalAmount = remainingAmount;
        applicationDataToUpdate["rewardWalletAmountApplied"] = walletUsed;
      }

      const redirectToPaymentGateway = totalAmount > 0 ? true : false;
      const statusOfPayment =
        totalAmount > 0 ? paymentStatus.PENDING : paymentStatus.SUCCESS;
      applicationDataToUpdate["status"] = redirectToPaymentGateway
        ? status.BLANK
        : status.PENDING;
      applicationDataToUpdate["txnStatus"] = statusOfPayment;
      applicationDataToUpdate["totalPrice"] = parseFloat(
        totalAmount.toString()
      ).toFixed(2);
      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      const panApplied = await this.panAppModel.findOneAndUpdate(
        {
          srn: srn,
          isDeleted: false,
        },
        { $set: { ...applicationDataToUpdate } },
        { new: true }
      );

      if (!panApplied) {
        throw new HttpException(
          "Unable to add pan application.",
          HttpStatus.OK
        );
      }

      const transactionDataToBeAdd = {
        txnId: "",
        serialNumber: applicationDataToUpdate.serialNumber,
        uniqueTransactionId: applicationDataToUpdate.uniqueTransactionId,
        sjbtCode: applicationFound.distributorCode,
        userId: applicationFound.appliedById,
        userType: applicationFound.appliedAsType,
        applicationDetails: [
          {
            applicationId: panApplied._id,
            applicationType: serviceType.PAN,
            srn: applicationFound.srn,
          },
        ],
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: applicationFound["totalPrice"],
        remark: `Transaction created for PAN application having SRN ${
          applicationFound.srn
        } on ${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")} `,
        reqData: [],
        resData: [],
      };

      resDataToSend.paymentGatewayData["orderId"] =
        applicationFound.uniqueTransactionId;
      resDataToSend.paymentGatewayData["token"] = null;
      resDataToSend.paymentGatewayData["amount"] =
        applicationFound["totalPrice"];
      resDataToSend.paymentGatewayData["tokenType"] = null;

      if (redirectToPaymentGateway) {
        const paymentInitializeResponse: any =
          await this.paytmFunctions.initiatePayment({
            userId: req.userData.Id,
            totalAmount: parseFloat(totalAmount.toString()).toFixed(2),
            email: applicationFound.email,
            uniqueTransactionId: applicationDataToUpdate.uniqueTransactionId,
            mobileNumber: applicationFound.mobileNumber,
            appliedFrom,
          });

        if (
          !paymentInitializeResponse["status"] ||
          paymentInitializeResponse["data"] === null
        ) {
          throw new HttpException(
            "Something went wrong. Unable to open payment gateway. Please try again.",
            HttpStatus.OK
          );
        }

        const { reqData, resData, orderId, txnToken, txnAmount, txnStatus } =
          paymentInitializeResponse["data"];
        transactionDataToBeAdd.reqData = reqData;
        transactionDataToBeAdd.resData = resData;
        resDataToSend.paymentGatewayData["orderId"] = orderId;
        resDataToSend.paymentGatewayData["token"] = txnToken;
        resDataToSend.paymentGatewayData["amount"] = txnAmount;
        resDataToSend.paymentGatewayData["tokenType"] = "TXN_TOKEN";
      } else {
        resDataToSend.paymentGatewayData["orderId"] =
          applicationFound.uniqueTransactionId;
        resDataToSend.paymentGatewayData["token"] = null;
        resDataToSend.paymentGatewayData["amount"] =
          applicationFound["totalPrice"];
        resDataToSend.paymentGatewayData["tokenType"] = null;

        //-----------update appliedon Date time of application----------//

        const updateApplication = await this.panAppModel.findByIdAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(applicationFound._id),
            isDeleted: false,
          },
          {
            $set: { appliedOnDate: currentDate },
          },
          { new: true }
        );
      }

      const transactionCreated = await this.TransactionModel.create(
        transactionDataToBeAdd
      );

      if (!transactionCreated) {
        const deleteApplication = await this.panAppModel.findOneAndDelete({
          uniqueTransactionId: applicationFound.uniqueTransactionId,
        });
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_RETRY_SERVICE_PAYMENT",
          req.userData.contactNumber,
          true,
          200,
          `${requestedType}${req.userData?.contactNumber || ""} applied for ${
            panApplied.srn
          } PAN application at ${currentDate}.`,
          "PAN application applied successfully.",
          req.socket.remoteAddress
        );

        throw new HttpException(
          "Unable to initiate transaction. Please try again.",
          HttpStatus.OK
        );
      }
      const panAdd = await extractFieldsForPanFlowTable(panApplied);
      const updatedPanFlow = await new this.PanAppFlowModel({
        panApplicationId: panApplied._id,
        ...panAdd,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_RETRY_SERVICE_PAYMENT",
        panApplied._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } applied for PAN ${panApplied.srn} at ${currentDate}.`,
        "PAN application applied successfully.",
        req.socket.remoteAddress
      );

      /**
       * call post application function to update refund , reward wallet,
       */

      if (isRefundToBeUpdate === true) {
        const refundWalletUpdate =
          await this.postApplication.updateRefundWalletForCart(
            applicationDataToUpdate["refundWalletAmountApplied"],
            updateRefundWallet,
            req.userData.Id,
            serviceType.PAN,
            panApplied._id,
            req.userData.type,
            applicationFound.uniqueTransactionId,
            req,
            applicationFound.srn
          );
      }

      if (
        // panApplied.appliedAsType !== Role.GUEST &&
        // panApplied.appliedByType !== Role.GUEST &&
        isRewardToBeUpdate === true
      ) {
        const rewardWalletUpdate =
          await this.postApplication.updateRewardWalletForCart(
            applicationDataToUpdate["rewardWalletAmountApplied"],
            updateRewardWallet,
            req.userData.Id,
            serviceType.PAN,
            panApplied._id,
            panApplied.srn,
            applicationFound.uniqueTransactionId,
            req
          );
      }

      return res.status(200).send({
        message: "PAN application applied successfully.",
        status: true,
        data: resDataToSend,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_RETRY_SERVICE_PAYMENT",
        req.userData.contactNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.contactNumber || ""
        } tried to retry paymnent of  PAN application with this ${
          req.userData.contactNumber
        }.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
  //-------------------------------------------------------------------------

  //-------------------------------------------------------------------------
  /***
   * find all PanApplications
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const query = [];

      /**project query for admin role */
      const accessFields = await this.userAuthHelper.getAccessFields(
        req.userData.type,
        "PAN_APPLICATIONS"
      );

      if (!accessFields.length) {
        throw new HttpException("Permission denied.", HttpStatus.OK);
      }

      if (req.userData.type === "ADMIN") {
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      const dataFound = await this.panAppModel.aggregate(query);
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_LIST",
        "",
        true,
        200,
        `${requestedType}${
          req.userData?.contactNumber || ""
        } checked list of PAN application at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: dataFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to check list of PAN application with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * find PanApplication
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let matchQuery: any = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        matchQuery = {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        };
      }

      let additionalQuery = [
        {
          $addFields: {
            applied_by_id: { $toObjectId: "$appliedById" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "applied_by_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            appliedByUserPanNumber: { $arrayElemAt: ["$user.panNumber", 0] },
            appliedByUserFirmName: { $arrayElemAt: ["$user.firmName", 0] },
            appliedByUserFirmAddress: { $arrayElemAt: ["$user.address", 0] },
            retailerId: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: "$appliedById",
                else: "",
              },
            },
            retailerName: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: { $arrayElemAt: ["$user.name", 0] },
                else: "",
              },
            },
            retailerFirmName: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: { $arrayElemAt: ["$user.firmName", 0] },
                else: "",
              },
            },
            retailerFirmAddress: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: { $arrayElemAt: ["$user.address", 0] },
                else: "",
              },
            },
            retailerMobileNumber: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: { $arrayElemAt: ["$user.mobileNumber", 0] },
                else: "",
              },
            },
            retailerPanNumber: {
              $cond: {
                if: { $eq: ["$appliedAsType", "RETAILER"] },
                then: { $arrayElemAt: ["$user.panNumber", 0] },
                else: "",
              },
            },

            appliedByUserCurrentAddress: {
              $concat: [
                { $arrayElemAt: ["$user.address", 0] },
                ", ",
                { $arrayElemAt: ["$user.area", 0] },
                ", ",
                { $arrayElemAt: ["$user.cityVillageName", 0] },
                ", ",
                { $arrayElemAt: ["$user.district", 0] },
                " ",
                { $arrayElemAt: ["$user.pincode", 0] },
                ", ",
                { $arrayElemAt: ["$user.state", 0] },
              ],
            },
          },
        },
        {
          $unset: "user",
        },
        {
          $unwind: {
            path: "$paymentCategory",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "pancategories",
            localField: "paymentCategory",
            foreignField: "categoryCode",
            as: "categoryPan",
          },
        },
        {
          $group: {
            _id: "$_id",
            category: { $first: "$category" },
            title: { $first: "$title" },
            name: { $first: "$name" },
            dob: { $first: "$dob" },
            parentName: { $first: "$parentName" },
            parentType: { $first: "$parentType" },
            adhaarNumber: { $first: "$adhaarNumber" },
            mobileNumber: { $first: "$mobileNumber" },
            email: { $first: "$email" },
            panCardFront: { $first: "$panCardFront" },
            passportPhotoUrl: { $first: "$passportPhotoUrl" },
            signaturePhotoUrl: { $first: "$signaturePhotoUrl" },
            panFormFrontPhotoUrl: { $first: "$panFormFrontPhotoUrl" },
            panFormBackPhotoUrl: { $first: "$panFormBackPhotoUrl" },
            adhaarFrontPhotoUrl: { $first: "$adhaarFrontPhotoUrl" },
            adhaarBackPhotoUrl: { $first: "$adhaarBackPhotoUrl" },
            otherDocuments: { $first: "$otherDocuments" },
            srn: { $first: "$srn" },
            paymentCategory: {
              $push: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ["$paymentCategory", ""] },
                      { $gt: [{ $size: "$categoryPan.categoryName" }, 0] },
                    ],
                  },
                  then: {
                    code: "$paymentCategory",
                    name: { $arrayElemAt: ["$categoryPan.categoryName", 0] },
                  },
                  else: "$paymentCategory",
                },
              },
            },
            distributorCode: { $first: "$distributorCode" },
            distributorId: { $first: "$distributorId" },
            cartApplicationId: { $first: "$cartApplicationId" },
            txnId: { $first: "$txnId" },
            uniqueTransactionId: { $first: "$uniqueTransactionId" },
            txnObjectId: { $first: "$txnObjectId" },
            version: { $first: "$version" },
            panNumber: { $first: "$panNumber" },
            totalPrice: { $first: "$totalPrice" },
            mainCategoryPrice: { $first: "$mainCategoryPrice" },
            additionalCat2: { $first: "$additionalCat2" },
            additionalCat3: { $first: "$additionalCat3" },
            convinienceCharges: { $first: "$convinienceCharges" },
            basePrice: { $first: "$basePrice" },
            baseCatAppied: { $first: "$baseCatAppied" },
            refundWalletAmountApplied: { $first: "$refundWalletAmountApplied" },
            rewardWalletAmountApplied: { $first: "$rewardWalletAmountApplied" },
            applicationIndividualPrice: {
              $first: "$applicationIndividualPrice",
            },
            acknowledgementNumber: { $first: "$acknowledgementNumber" },
            acknowledgementPdf: { $first: "$acknowledgementPdf" },
            rejectionReason: { $first: "$rejectionReason" },
            remark: { $first: "$remark" },
            status: { $first: "$status" },
            comments: { $first: "$comments" },
            applicationType: { $first: "$applicationType" },
            appliedFrom: { $first: "$appliedFrom" },
            txnStatus: { $first: "$txnStatus" },
            appliedByType: { $first: "$appliedByType" },
            appliedByUserCurrentAddress: {
              $first: "$appliedByUserCurrentAddress",
            },
            appliedById: { $first: "$appliedById" },
            appliedOnDate: { $first: "$appliedOnDate" },
            appliedByName: { $first: "$appliedByName" },
            appliedByNumber: { $first: "$appliedByNumber" },
            appliedAsType: { $first: "$appliedAsType" },
            assignedToName: { $first: "$assignedToName" },
            assignedToId: { $first: "$assignedToId" },
            assignedOnDate: { $first: "$assignedOnDate" },
            assignedByName: { $first: "$assignedByName" },
            assignedById: { $first: "$assignedById" },
            verifiedByName: { $first: "$verifiedByName" },
            verifiedById: { $first: "$verifiedById" },
            verifiedOnDate: { $first: "$verifiedOnDate" },
            rejectedByName: { $first: "$rejectedByName" },
            rejectedById: { $first: "$rejectedById" },
            rejectedOnDate: { $first: "$rejectedOnDate" },
            generatedByName: { $first: "$generatedByName" },
            generatedById: { $first: "$generatedById" },
            generatedOnDate: { $first: "$generatedOnDate" },
            completedByName: { $first: "$completedByName" },
            completedById: { $first: "$completedById" },
            completedOnDate: { $first: "$completedOnDate" },
            cancelledByName: { $first: "$cancelledByName" },
            cancelledById: { $first: "$cancelledById" },
            cancelledOnDate: { $first: "$cancelledOnDate" },
            moveToPendingByName: { $first: "$moveToPendingByName" },
            moveToPendingById: { $first: "$moveToPendingById" },
            moveToPendingOnDate: { $first: "$moveToPendingOnDate" },
            IsAgreedToTermsAndConditions: {
              $first: "$IsAgreedToTermsAndConditions",
            },
            retailerId: { $first: "$retailerId" },
            retailerName: { $first: "$retailerName" },
            retailerFirmName: { $first: "$retailerFirmName" },
            retailerFirmAddress: { $first: "$retailerFirmAddress" },
            retailerMobileNumber: { $first: "$retailerMobileNumber" },
            retailerPanNumber: { $first: "$retailerPanNumber" },
            isDeleted: { $first: "$isDeleted" },
            serialNumber: { $first: "$serialNumber" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            appliedByUserPanNumber: { $first: "$appliedByUserPanNumber" },
            appliedByUserFirmName: { $first: "$appliedByUserFirmName" },
            appliedByUserFirmAddress: { $first: "$appliedByUserFirmAddress" },
          },
        },
      ];

      let countQuery = [
        {
          $match: matchQuery,
        },
        ...additionalQuery,
      ];

      let projectQuery = {};

      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "PAN_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const PanApplicationFound = await this.panAppModel.aggregate(countQuery);

      if (!PanApplicationFound.length) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed PAN application ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );

      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: PanApplicationFound[0],
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to view PAN application ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * update PanApplication
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, res, req) {
    try {
      const {
        category,
        title,
        name,
        dob,
        email,
        parentName,
        parentType,
        adhaarNumber,
        mobileNumber,
        panCardFront,
        passportPhotoUrl,
        signaturePhotoUrl,
        panFormFrontPhotoUrl,
        panFormBackPhotoUrl,
        adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl,
        panNumber,
        acknowledgementNumber,
        comments,
        appliedFrom,
        IsAgreedToTermsAndConditions,
        otherDocuments,
        paymentCategory,
        version,
      } = req.body;

      const reqParams = [
        "category",
        "title",
        "name",
        "dob",
        "email",
        "parentName",
        "parentType",
        "adhaarNumber",
        "mobileNumber",
        "panCardFront",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "panNumber",
        "acknowledgementNumber",
        "comments",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "otherDocuments",
        "paymentCategory",
        "version",
      ];

      let requiredKeys = [
        "category",
        "title",
        "dob",
        "email",
        "adhaarNumber",
        "mobileNumber",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "paymentCategory",
      ];

      /**check if application type is correction then category is not required */
      if (panNumber && panNumber !== "") {
        requiredKeys = [
          "title",
          "dob",
          "email",
          "adhaarNumber",
          "mobileNumber",
          "panCardFront",
          "passportPhotoUrl",
          "signaturePhotoUrl",
          "panFormFrontPhotoUrl",
          "adhaarFrontPhotoUrl",
          "adhaarBackPhotoUrl",
          "appliedFrom",
          "IsAgreedToTermsAndConditions",
          "paymentCategory",
        ];
      }

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: "BAD_REQUEST",
          issue: "REQUEST_BODY_VALIDATION_FAILED",
          data: null,
        });
      }
      /**check pan card number is valid or not */
      if (req.body.panNumber && !isPanValid(req.body.panNumber)) {
        throw new HttpException(
          "PAN card number must be a valid number.",
          HttpStatus.OK
        );
      }

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const PanApplicationFound = await this.panAppModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!PanApplicationFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (PanApplicationFound.status == status.CANCELLED) {
        throw new HttpException(
          "You are not allowed to perform this action.",
          HttpStatus.OK
        );
      }

      if (PanApplicationFound.status !== status.REJECT) {
        throw new HttpException(
          `You can not update this application, Your application is already in ${PanApplicationFound.status}.`,
          HttpStatus.OK
        );
      }

      /**check mobile number is valid or not*/
      if (req.body.mobileNumber && !isMobileValid(req.body.mobileNumber)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check email is valid or not */
      if (req.body.email && !isEmailValid(req.body.email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      /**check adhar number is valid or not */
      if (
        req.body.adhaarNumber &&
        isAadharValid(req.body.adhaarNumber) === false
      ) {
        throw new HttpException(
          "Aadhar number must be valid number.",
          HttpStatus.OK
        );
      }

      /**check dob format is valid or not */
      if (req.body.dob && !isValidDate(req.body.dob)) {
        throw new HttpException(
          "Date must be in YYYY-MM-DD format.",
          HttpStatus.OK
        );
      }

      /**check passportPhotoUrl is valid or not */
      if (
        req.body.passportPhotoUrl &&
        isvalidUrl(req.body.passportPhotoUrl) === false
      ) {
        throw new HttpException(
          "Passoport photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check signaturePhotoUrl is valid or not */
      if (
        req.body.signaturePhotoUrl &&
        isvalidUrl(req.body.signaturePhotoUrl) === false
      ) {
        throw new HttpException(
          "Signature photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check panFormFrontPhotoUrl is valid or not */
      if (
        req.body.panFormFrontPhotoUrl &&
        isvalidUrl(req.body.panFormFrontPhotoUrl) === false
      ) {
        throw new HttpException(
          "PAN form front photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check panFormBackPhotoUrl is valid or not */
      if (
        req.body.panFormBackPhotoUrl &&
        isvalidUrl(req.body.panFormBackPhotoUrl) === false
      ) {
        throw new HttpException(
          "PAN form back photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check adhaarFrontPhotoUrl is valid or not */
      if (
        req.body.adhaarFrontPhotoUrl &&
        isvalidUrl(req.body.adhaarFrontPhotoUrl) === false
      ) {
        throw new HttpException(
          "Adhaar front photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check adhaarBackPhotoUrl is valid or not */
      if (
        req.body.adhaarBackPhotoUrl &&
        isvalidUrl(req.body.adhaarBackPhotoUrl) === false
      ) {
        throw new HttpException(
          "Adhaar back photo url must be valid url.",
          HttpStatus.OK
        );
      }

      const fieldsUpdated = await fieldsToBeUpdate();
      const addMorefieldsToBeUpdate = {
        status: "PENDING",
        moveToPendingByName: "",
        moveToPendingById: "",
        moveToPendingOnDate: "",
      };
      let dataToUpdate = {
        category: req.body.category,
        title: req.body.title,
        dob: req.body.dob,
        parentName: req.body.parentName,
        parentType: req.body.parentType,
        adhaarNumber: req.body.adhaarNumber,
        mobileNumber: req.body.mobileNumber,
        email: req.body.email,
        panCardFront: req.body.panCardFront,
        passportPhotoUrl: req.body.passportPhotoUrl,
        signaturePhotoUrl: req.body.signaturePhotoUrl,
        panFormFrontPhotoUrl: req.body.panFormFrontPhotoUrl,
        panFormBackPhotoUrl: req.body.panFormBackPhotoUrl,
        adhaarFrontPhotoUrl: req.body.adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl: req.body.adhaarBackPhotoUrl,
        otherDocuments: req.body.otherDocuments,
        version: req.body.version,
        acknowledgementPdf: req.body.acknowledgementPdf,
        applicationType: req.body.applicationType,
        appliedFrom: req.body.appliedFrom,
        panNumber: req.body.panNumber,
        comments: req.body.comments,
      };

      const newPanUpdate = await this.panAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        {
          $set: {
            ...dataToUpdate,
            ...fieldsUpdated,
            ...addMorefieldsToBeUpdate,
          },
        },
        { new: true }
      );

      if (!newPanUpdate) {
        throw new HttpException("Could not update data.", HttpStatus.OK);
      }

      const panadd = await extractFieldsForPanFlowTable(newPanUpdate);
      const updatedPanFlow = await new this.PanAppFlowModel({
        panApplicationId: newPanUpdate._id,
        ...panadd,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_UPDATE",
        id,
        true,
        200,
        `${requestedType}${
          req.userData?.contactNumber || ""
        } updated PAN application ${id} at ${currentDate}.`,
        "PAN application updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Pan application updated successfully.",
        status: true,
        data: newPanUpdate,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_UPDATE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * all with filter pagination
   */
  //-------------------------------------------------------------------------
  async allWithFilters(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let limit = req.body.limit;
      let page = req.body.page;
      let orderBy = req.body.orderBy;
      let orderByValue = req.body.orderByValue;
      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;
      const filterBy = req.body.filterBy;
      const rangeFilterBy = req.body.rangeFilterBy;
      const isPaginationRequired: boolean =
        req.body.isPaginationRequired === "false" ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        "_id",
        "category",
        "title",
        "name",
        "email",
        "dob",
        "parentName",
        "parentType",
        "adhaarNumber",
        "mobileNumber",
        "panCardFront",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "otherDocuments",
        "comment",
        "distributorCode",
        "appliedBy",
        "appliedAs",
        "txnId",
        "uniqueTransactionId",
        "payementDetails",
        "appliedFrom",
        "srn",
        "paymentCategory",
        "version",
        "panNumber",
        "acknowledgementNumber",
        "status",
        "appliedByNumber",
        "appliedById",
        "appliedByName",
        "cancelledByName",
        "completedByName",
        "rejectedByName",
        "verifiedByName",
        "assignedTo",
        "assignedBy",
        "assignedToName",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [
          { isDeleted: false },
          {
            status: { $nin: [status.BLANK] },
          },
        ],
      };

      /**
       * to send only active data on web
       */

      limit = parseInt(limit);
      page = parseInt(page);

      if (
        limit === undefined ||
        !limit ||
        limit < 1 ||
        Math.sign(limit) === -1
      ) {
        limit = 10;
      }

      if (page === undefined || !page || page < 1 || Math.sign(page) === -1) {
        page = 1;
      }

      if (
        orderBy === undefined ||
        orderBy === "" ||
        typeof orderBy !== "string"
      ) {
        orderBy = "appliedOnDate";
      }

      if (
        orderByValue === undefined ||
        orderByValue === "" ||
        isNaN(parseInt(orderByValue))
      ) {
        orderByValue = -1;
      }

      const skip = page * limit - limit;

      //check search keys valid

      if (searchIn === undefined) {
        searchIn = [];
      } else if (!Array.isArray(searchIn)) {
        throw new HttpException(`params must be an array`, HttpStatus.OK);
      } else if (searchIn.length) {
        for (const key in searchIn) {
          if (searchIn[key] === "") {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK
            );
          }
        }
      }
      //check search keys valid
      //----------------------------
      //searchQuery
      const searchQuery = [];

      if (
        searchValue !== undefined &&
        searchValue !== "" &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: "i" };
        for (const each in searchKeys) {
          const key = searchKeys[each];
          const val = value;
          searchQuery.push({ [key]: val });
        }
      }
      //searchQuery
      //----------------------------

      if (
        rangeFilterBy !== undefined &&
        rangeFilterBy !== null &&
        typeof rangeFilterBy === "object"
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== "" &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === "string"
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== "" &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== "" &&
              rangeFilterBy.rangeEnd !== null &&
              !isNaN(parseFloat(rangeFilterBy.rangeEnd))
            ) {
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $gte: rangeFilterBy.rangeInitial,
                },
              });
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $lte: rangeFilterBy.rangeEnd,
                },
              });
            }
          }
        }
      }

      //----------------------------
      const invalidData = ["null", null, undefined, "undefined", ""];
      const booleanFields = [];
      const numberFileds = ["version"];

      if (filterBy !== undefined) {
        if (!Array.isArray(filterBy)) {
          throw new HttpException(`filterBy must be an array.`, HttpStatus.OK);
        }
        if (filterBy.length > 0) {
          for (const each in filterBy) {
            if (!invalidData.includes(filterBy[each].fieldName)) {
              if (filterBy[each].fieldName === "status") {
                const adminApplicationAcces =
                  await this.adminHelper.getAdminApplicationAcces(
                    req.userData.Id,
                    serviceType.PAN,
                    filterBy[each].value
                  );
                if (adminApplicationAcces.status) {
                  if (adminApplicationAcces.data.length) {
                    filterQuery.push(...adminApplicationAcces.data);
                  }
                } else {
                  throw new HttpException(
                    `${adminApplicationAcces.message}`,
                    HttpStatus.OK
                  );
                }
              }
              if (Array.isArray(filterBy[each].value)) {
                if (filterBy[each].value.length) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: { $in: filterBy[each].value },
                  });
                }
              } else if (filterBy[each].value !== "") {
                if (
                  typeof filterBy[each].value === "string" &&
                  !booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: filterBy[each].value,
                  });
                } else if (
                  numberFileds.includes(filterBy[each].fieldName) &&
                  !isNaN(parseInt(filterBy[each].value))
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: parseInt(filterBy[each].value),
                  });
                } else if (
                  typeof filterBy[each].value === "boolean" ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === "true"
                        ? true
                        : false,
                  });
                }
              }
            }
          }
        }
      }
      //----------------------------
      //calander filter
      /**
       *
       * ToDo : for date filter
       *
       */
      const allowedDateFiletrKeys = [
        "createdAt",
        "updatedAt",
        "verifiedOnDate",
        "appliedOnDate",
      ];

      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== null &&
          dateFilter.dateFilterKey !== ""
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK
            );
          }
        } else {
          dateFilter.dateFilterKey = "appliedOnDate";
          dateFilter.doneFilterKey = "verifiedOnDate";
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null &&
          dateFilter.end_date !== "" &&
          (dateFilter.start_date === undefined || dateFilter.start_date === "")
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (
          dateFilter.start_date !== "" &&
          dateFilter.end_date !== "" &&
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null
        ) {
          dateFilter.start_date = new Date(`${dateFilter.start_date}`);
          dateFilter.end_date = new Date(`${dateFilter.end_date}`);
          dateFilter.start_date.setHours(0, 0, 0, 0);
          dateFilter.end_date.setHours(23, 59, 59, 999);

          if (dateFilter.dateFilterKey !== "createdAt") {
            dateFilter.start_date = moment(dateFilter.start_date)
              .add(5, "hours")
              .startOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            dateFilter.end_date = moment(dateFilter.end_date)
              .endOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            filterQuery.push({
              [`${dateFilter.dateFilterKey}`]: {
                $gte: dateFilter.start_date,
                $lte: dateFilter.end_date,
              },
            });
          } else {
            filterQuery.push({
              $expr: {
                $and: [
                  {
                    $gte: [
                      {
                        $convert: {
                          input: `$${dateFilter.dateFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.start_date}`),
                    ],
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: `$${dateFilter.dateFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.end_date}`),
                    ],
                  },
                ],
              },
            });
          }
        }

        if (
          dateFilter.done_date_from !== undefined &&
          dateFilter.done_date_from !== null &&
          dateFilter.done_date_from !== "" &&
          (dateFilter.done_date_to === undefined ||
            dateFilter.done_date_to === "")
        ) {
          dateFilter.done_date_to = dateFilter.done_date_from;
        } else if (
          dateFilter.done_date_to !== undefined &&
          dateFilter.done_date_to !== null &&
          dateFilter.done_date_to !== "" &&
          (dateFilter.done_date_from === undefined ||
            dateFilter.done_date_from === "")
        ) {
          dateFilter.done_date_from = dateFilter.done_date_to;
        }
        if (
          dateFilter.done_date_from !== "" &&
          dateFilter.done_date_to !== "" &&
          dateFilter.done_date_to !== undefined &&
          dateFilter.done_date_to !== null &&
          dateFilter.done_date_from !== undefined &&
          dateFilter.done_date_from !== null
        ) {
          dateFilter.done_date_from = new Date(`${dateFilter.done_date_from}`);
          dateFilter.done_date_to = new Date(`${dateFilter.done_date_to}`);
          dateFilter.done_date_from.setHours(0, 0, 0, 0);
          dateFilter.done_date_to.setHours(23, 59, 59, 999);

          if (dateFilter.doneFilterKey !== "createdAt") {
            dateFilter.done_date_from = moment(dateFilter.done_date_from)
              .add(5, "hours")
              .startOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            dateFilter.done_date_to = moment(dateFilter.done_date_to)
              .endOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            filterQuery.push({
              [`${dateFilter.doneFilterKey}`]: {
                $gte: dateFilter.done_date_from,
                $lte: dateFilter.done_date_to,
              },
            });
          } else {
            filterQuery.push({
              $expr: {
                $and: [
                  { $eq: ["$status", status.VERIFY] },
                  {
                    $gte: [
                      {
                        $convert: {
                          input: `$${dateFilter.doneFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.done_date_from}`),
                    ],
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: `$${dateFilter.doneFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.done_date_to}`),
                    ],
                  },
                ],
              },
            });
          }
        }
      }

      //calander filter
      //----------------------------

      //search query-----------

      if (searchQuery.length > 0) {
        matchQuery.$and.push({ $or: searchQuery });
      }

      //search query-----------
      //----------------for filter

      if (filterQuery.length > 0) {
        for (const each in filterQuery) {
          matchQuery.$and.push(filterQuery[each]);
        }
      }
      const countQuery = [];
      const additionaQuery = [];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.panAppModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === "" ? totalData : limit));
      } else {
        limit = totalData;
      }

      query.push(...additionaQuery, {
        $match: matchQuery,
      });

      query.push({ $sort: { [orderBy]: parseInt(orderByValue) } });
      if (isPaginationRequired) {
        query.push({ $skip: skip });
        query.push({ $limit: limit });
      }

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "PAN_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      const result = await this.panAppModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view PAN application at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Data Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to filter data with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * all with filter pagination
   */
  //-------------------------------------------------------------------------
  async statusWiseFilter(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let limit = req.body.limit;
      let page = req.body.page;
      let orderBy = req.body.orderBy;
      let orderByValue = req.body.orderByValue;
      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;
      const filterBy = req.body.filterBy;
      const rangeFilterBy = req.body.rangeFilterBy;
      const isPaginationRequired: boolean =
        req.body.isPaginationRequired === "false" ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        "_id",
        "category",
        "title",
        "name",
        "email",
        "dob",
        "parentName",
        "parentType",
        "adhaarNumber",
        "mobileNumber",
        "panCardFront",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "otherDocuments",
        "comment",
        "distributorCode",
        "appliedBy",
        "appliedAs",
        "txnId",
        "uniqueTransactionId",
        "payementDetails",
        "appliedFrom",
        "srn",
        "paymentCategory",
        "version",
        "panNumber",
        "acknowledgementNumber",
        "status",
        "appliedByNumber",
        "assignedTo",
        "assignedBy",
        "assignedToName",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
      };

      matchQuery = await statusWiseApplications(req, matchQuery);

      /**
       * to send only active data on web
       */

      limit = parseInt(limit);
      page = parseInt(page);

      if (
        limit === undefined ||
        !limit ||
        limit < 1 ||
        Math.sign(limit) === -1
      ) {
        limit = 10;
      }

      if (page === undefined || !page || page < 1 || Math.sign(page) === -1) {
        page = 1;
      }

      if (
        orderBy === undefined ||
        orderBy === "" ||
        typeof orderBy !== "string"
      ) {
        orderBy = "createdAt";
      }

      if (
        orderByValue === undefined ||
        orderByValue === "" ||
        isNaN(parseInt(orderByValue))
      ) {
        orderByValue = -1;
      }

      const skip = page * limit - limit;

      //check search keys valid

      if (searchIn === undefined) {
        searchIn = [];
      } else if (!Array.isArray(searchIn)) {
        throw new HttpException(`params must be an array`, HttpStatus.OK);
      } else if (searchIn.length) {
        for (const key in searchIn) {
          if (searchIn[key] === "") {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK
            );
          }
        }
      }
      //check search keys valid
      //----------------------------
      //searchQuery
      const searchQuery = [];

      if (
        searchValue !== undefined &&
        searchValue !== "" &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: "i" };
        for (const each in searchKeys) {
          const key = searchKeys[each];
          const val = value;
          searchQuery.push({ [key]: val });
        }
      }
      //searchQuery
      //----------------------------

      if (
        rangeFilterBy !== undefined &&
        rangeFilterBy !== null &&
        typeof rangeFilterBy === "object"
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== "" &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === "string"
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== "" &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== "" &&
              rangeFilterBy.rangeEnd !== null &&
              !isNaN(parseFloat(rangeFilterBy.rangeEnd))
            ) {
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $gte: rangeFilterBy.rangeInitial,
                },
              });
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $lte: rangeFilterBy.rangeEnd,
                },
              });
            }
          }
        }
      }

      //----------------------------
      const invalidData = ["null", null, undefined, "undefined", ""];
      const booleanFields = [];
      const numberFileds = ["version"];

      if (filterBy !== undefined) {
        if (!Array.isArray(filterBy)) {
          throw new HttpException(`filterBy must be an array.`, HttpStatus.OK);
        }
        if (filterBy.length > 0) {
          for (const each in filterBy) {
            if (!invalidData.includes(filterBy[each].fieldName)) {
              if (filterBy[each].fieldName === "status") {
                const adminApplicationAcces =
                  await this.adminHelper.getAdminApplicationAcces(
                    req.userData.Id,
                    serviceType.PAN,
                    filterBy[each].value
                  );
                if (adminApplicationAcces.status) {
                  if (adminApplicationAcces.data.length) {
                    filterQuery.push(...adminApplicationAcces.data);
                  }
                } else {
                  throw new HttpException(
                    `${adminApplicationAcces.message}`,
                    HttpStatus.OK
                  );
                }
              }
              if (Array.isArray(filterBy[each].value)) {
                if (filterBy[each].value.length) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: { $in: filterBy[each].value },
                  });
                }
              } else if (filterBy[each].value !== "") {
                if (
                  typeof filterBy[each].value === "string" &&
                  !booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: filterBy[each].value,
                  });
                } else if (
                  numberFileds.includes(filterBy[each].fieldName) &&
                  !isNaN(parseInt(filterBy[each].value))
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: parseInt(filterBy[each].value),
                  });
                } else if (
                  typeof filterBy[each].value === "boolean" ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === "true"
                        ? true
                        : false,
                  });
                }
              }
            }
          }
        }
      }
      //----------------------------
      //calander filter
      /**
       *
       * ToDo : for date filter
       *
       */

      const allowedDateFiletrKeys = ["createdAt", "updatedAt"];
      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== null &&
          dateFilter.dateFilterKey !== ""
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK
            );
          }
        } else {
          dateFilter.dateFilterKey = "createdAt";
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null &&
          dateFilter.end_date !== "" &&
          (dateFilter.start_date === undefined || dateFilter.start_date === "")
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (dateFilter.start_date !== "" && dateFilter.end_date !== "") {
          dateFilter.start_date = new Date(`${dateFilter.start_date}`);
          dateFilter.end_date = new Date(`${dateFilter.end_date}`);
          dateFilter.start_date.setHours(0, 0, 0, 0);
          dateFilter.end_date.setHours(23, 59, 59, 999);

          filterQuery.push({
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $convert: {
                        input: `$${dateFilter.dateFilterKey}`,
                        to: "date",
                      },
                    },
                    new Date(`${dateFilter.start_date}`),
                  ],
                },
                {
                  $lte: [
                    {
                      $convert: {
                        input: `$${dateFilter.dateFilterKey}`,
                        to: "date",
                      },
                    },
                    new Date(`${dateFilter.end_date}`),
                  ],
                },
              ],
            },
          });
        }
      }

      //calander filter
      //----------------------------

      //search query-----------

      if (searchQuery.length > 0) {
        matchQuery.$and.push({ $or: searchQuery });
      }

      //search query-----------
      //----------------for filter

      if (filterQuery.length > 0) {
        for (const each in filterQuery) {
          matchQuery.$and.push(filterQuery[each]);
        }
      }
      const countQuery = [];
      const additionaQuery = [];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      /**project query for admin role */

      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });

        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "PAN_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.panAppModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === "" ? totalData : limit));
      } else {
        limit = totalData;
      }

      query.push(...additionaQuery, {
        $match: matchQuery,
      });

      query.push({ $sort: { [orderBy]: parseInt(orderByValue) } });
      if (isPaginationRequired) {
        query.push({ $skip: skip });
        query.push({ $limit: limit });
      }

      const result = await this.panAppModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_STATUS_WISE",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view status wise PAN application  at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Data Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_STATUS WISE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data  status wise with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * update all status of application
   */
  //-------------------------------------------------------------------------
  async updateStatus(id: string, res, req, file: Express.Multer.File) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const requestedName = req.userData?.userName || "";

      const IdkeyToUpdate = requestedId;
      const NamekeyToUpdate = requestedName;
      const DatekeyToInsert = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const adminData = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isDeleted: false,
      });

      if (requestedType === "ADMIN" || requestedType === "SUPER_ADMIN") {
        if (!adminData) {
          throw new HttpException("User not found.", HttpStatus.OK);
        }
      }

      const PanApplicationFound = await this.panAppModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!PanApplicationFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      if (PanApplicationFound.status == status.CANCELLED) {
        throw new HttpException(
          `This application is cancelled.`,
          HttpStatus.OK
        );
      }

      ///check admin have access for status change

      const checkUpdateaAccess =
        await this.adminHelper.checkAccessForUpdateStatus(
          req,
          serviceType.PAN,
          adminData.applicationStatusAccess
        );

      if (!checkUpdateaAccess.status) {
        throw new HttpException(checkUpdateaAccess.message, HttpStatus.OK);
      }

      const currentstatus = PanApplicationFound.status;

      const activeStatus = changestatusForApp(
        currentstatus,
        req.body.requestedStatus
      );

      let dataToUpdate = {
        status: activeStatus,
        remark: req.body.remark,
      };

      if (req.body.requestedStatus === status.VERIFY) {
        if (!req.file) {
          return res.status(200).send({
            status: false,
            message: "Acknowledgement PDF is required.",
          });
        }

        if (
          !req.body.acknowledgementNumber ||
          req.body.acknowledgementNumber === ""
        ) {
          throw new HttpException(
            `Acknowledgement number is required.`,
            HttpStatus.OK
          );
        }

        const checkAckNumber = await this.panAppModel.findOne({
          acknowledgementNumber: req.body.acknowledgementNumber,
        });

        if (checkAckNumber) {
          throw new HttpException(
            "Acknowledgement number already exist with another application.",
            HttpStatus.OK
          );
        }

        const path_array = file.path.split("public");
        let imagePath = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;

        dataToUpdate["acknowledgementPdf"] = imagePath;
        dataToUpdate["acknowledgementNumber"] = req.body.acknowledgementNumber;

        /**send acknowledgement pdf through email */
        let user = await this.panHelper.getAppliedUser(
          PanApplicationFound.appliedById
        );

        let emailId =
          user.userType === Role.GUEST ? PanApplicationFound.email : user.email;

        const fileName = file.filename;

        let attachments = [
          {
            content: file.path,
            filename: "Acknowledgement.pdf",
          },
        ];

        let sendAttachments = await this.EmailService.sendAcknowledMentTemplate(
          {
            applicationType: serviceType.PAN,
            name: PanApplicationFound.name,
            refNo: PanApplicationFound.srn,
            emailAttachment: attachments,
          },
          emailId
        );

        //---------------------sendwhatsapp-msg-------------------//
        /**send whatsapp msg***/
        let parameters = [
          {
            type: "text",
            text: PanApplicationFound.name,
          },
          {
            type: "text",
            text: PanApplicationFound.srn,
          },
        ];

        let sendWhatsappMsg =
          await this.WhatsappMsgService.sendWhatsAppMsg91Function(
            user.mobileNumber,
            "APPLICATION_VERIFY",
            parameters,
            imagePath
            // "https://storage.googleapis.com/production-file-system/300595/arbehjef"
          );
      } else if (req.body.requestedStatus === status.REJECT) {
        dataToUpdate["rejectionReason"] = req.body.rejectionReason;
      }

      if (req.body.requestedStatus === status.IN_PROGRESS) {
        dataToUpdate["assignedToId"] = IdkeyToUpdate;
        dataToUpdate["assignedToName"] = NamekeyToUpdate;
        dataToUpdate["assignedOnDate"] = DatekeyToInsert;
        dataToUpdate["assignedById"] = IdkeyToUpdate;
        dataToUpdate["assignedByName"] = NamekeyToUpdate;

        //check maximum inProgressCount
        if (requestedType !== "SUPER_ADMIN") {
          const maxInprogressCount = adminData.maximumInprogressCount;
          const applicationsAssignedToUserCount = await this.panAppModel
            .find({
              assignedToId: requestedId,
              status: status.IN_PROGRESS,
            })
            .count();

          if (applicationsAssignedToUserCount >= maxInprogressCount) {
            throw new HttpException(
              `Assigned application limit is over.`,
              HttpStatus.OK
            );
          }
        }
      }

      if (req.body.requestedStatus === status.REJECT) {
        dataToUpdate["rejectedById"] = IdkeyToUpdate;
        dataToUpdate["rejectedByName"] = NamekeyToUpdate;
        dataToUpdate["rejectedOnDate"] = DatekeyToInsert;
      }

      if (req.body.requestedStatus === status.VERIFY) {
        dataToUpdate["verifiedById"] = IdkeyToUpdate;
        dataToUpdate["verifiedByName"] = NamekeyToUpdate;
        dataToUpdate["verifiedOnDate"] = DatekeyToInsert;

        //calculate reward points
        const countRewardPoint = await this.postApplication.checkApplication(
          PanApplicationFound._id,
          serviceType.PAN,
          req
        );
      }
      if (req.body.requestedStatus === status.GENERATE) {
        dataToUpdate["generatedById"] = IdkeyToUpdate;
        dataToUpdate["generatedByName"] = NamekeyToUpdate;
        dataToUpdate["generatedOnDate"] = DatekeyToInsert;
        dataToUpdate["assignedToId"] = IdkeyToUpdate;
        dataToUpdate["assignedToName"] = NamekeyToUpdate;
        dataToUpdate["assignedOnDate"] = DatekeyToInsert;

        //check print wait time
        if (requestedType !== "SUPER_ADMIN") {
          const printWaitTime = adminData.printWaitTime;

          const latestAssignedApplication = await this.PanAppFlowModel.find({
            generatedById: requestedId,
            status: status.GENERATE,
          }).sort({ createdAt: -1 });

          if (latestAssignedApplication.length > 0) {
            const recentAssignedApplicationToUser =
              latestAssignedApplication[0]["createdAt"];

            const createdAtMomentObj = moment(recentAssignedApplicationToUser);
            const waitingTimeMomentObj = createdAtMomentObj.add(
              printWaitTime,
              "minutes"
            );

            const currentMomentObj = moment();

            const duration = moment.duration(
              waitingTimeMomentObj.diff(currentMomentObj)
            );
            const minutes = duration.minutes();
            const seconds = duration.seconds();
            const formattedTime = `${minutes}:${seconds
              .toString()
              .padStart(2, "0")}`;

            // check whether the current time is before the waiting time
            if (currentMomentObj.isBefore(waitingTimeMomentObj)) {
              throw new HttpException(
                `You have to wait for ${formattedTime} minutes to generate the next application.`,
                HttpStatus.OK
              );
            }
          }
        }
      }

      if (req.body.requestedStatus === status.DONE) {
        dataToUpdate["completedById"] = IdkeyToUpdate;
        dataToUpdate["completedByName"] = NamekeyToUpdate;
        dataToUpdate["completedOnDate"] = DatekeyToInsert;
      }

      if (req.body.requestedStatus === status.CANCELLED) {
        dataToUpdate["cancelledById"] = IdkeyToUpdate;
        dataToUpdate["cancelledByName"] = NamekeyToUpdate;
        dataToUpdate["cancelledOnDate"] = DatekeyToInsert;
      }

      if (
        PanApplicationFound.status === status.REJECT &&
        req.body.requestedStatus === status.PENDING
      ) {
        dataToUpdate["moveToPendingById"] = IdkeyToUpdate;
        dataToUpdate["moveToPendingByName"] = NamekeyToUpdate;
        dataToUpdate["moveToPendingOnDate"] = DatekeyToInsert;
        const fieldsBeUpdate = await fieldsToBeUpdate();
        dataToUpdate = { ...dataToUpdate, ...fieldsBeUpdate };
      }

      if (req.body.requestedStatus === status.REJECT && req.file) {
        throw new HttpException(
          `File is not allowed with status REJECT.`,
          HttpStatus.OK
        );
      }

      if (req.body.requestedStatus == status.REJECT) {
        const checkRejection = await this.RejectionModel.findOne({
          rejectionMsg: req.body.rejectionReason,
        });

        if (!checkRejection) {
          throw new HttpException(
            `Please provide a valid reason.`,
            HttpStatus.OK
          );
        }
        /**send rejection msg*/
        let user = await this.panHelper.getAppliedUser(
          PanApplicationFound.appliedById
        );
        let msg91Data = {
          template_id: process.env.MSG91_REJECTION_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID,
          short_url: "0",
          mobiles: "+91" + PanApplicationFound.appliedByNumber,
          USERNAME: PanApplicationFound.name.toUpperCase(),
          SRN: PanApplicationFound.srn,
          REJECTION_REASON: req.body.rejectionReason,
          CONTACT_NUMBER: process.env.SJBT_CONTACT_NO,
        };

        const msgSent: any = await sendMsg91Function(msg91Data);

        if (!msgSent || !msgSent.sendStatus) {
          console.log(msgSent.sendStatus);
        }

        /**send rejection email */

        let emailId =
          user.userType === Role.GUEST ? PanApplicationFound.email : user.email;

        let rejectionEmail = await this.EmailService.sendEmailRejectionTemplate(
          {
            applicationType: serviceType.PAN,
            name: PanApplicationFound.name.toUpperCase(),
            rejectionMsg: req.body.rejectionReason,
            refNo: PanApplicationFound.srn,
          },
          emailId
        );

        if (!rejectionEmail) {
          console.log(msgSent.sendStatus);
        }
      }

      const newPanUpdate = await this.panAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        {
          $set: {
            ...dataToUpdate,
          },
        },
        { new: true }
      );

      const panadd = await extractFieldsForPanFlowTable(newPanUpdate);
      const updatedPanFlow = await new this.PanAppFlowModel({
        panApplicationId: newPanUpdate._id,
        ...panadd,
      }).save();

      if (activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_STATUS",
          id,
          true,
          200,
          `${requestedType} ${req.userData.userName} change status of PAN application ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus.replace(
            /_/g,
            " "
          )} of PAN application ${id} successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Changed status to ${activeStatus.replace(
            /_/g,
            " "
          )} successfully.`,
          status: true,
          data: null,
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to change status of PAN ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   *  all status of application
   */
  //-------------------------------------------------------------------------
  async statusCounts(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const collection = await this.panAppModel.collection;

      const result = await getApplicationCounts(collection);
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_STATUS_COUNT",
        "",
        true,
        200,
        `${requestedType}${
          req.userData?.contactNumber || ""
        } view status count of PAN application at ${currentDate}.`,
        "Data Found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: result,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_STATUS_COUNT",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to view data of status count with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * Assign to sjbt user
   */
  //-------------------------------------------------------------------------

  async assignTo(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let assignTo = req.userData?.Id || "";

      const dataFound = await this.panAppModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!dataFound) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }

      if (
        req.body.assignToSjbtUser !== undefined &&
        req.body.assignToSjbtUser !== null &&
        req.body.assignToSjbtUser !== ""
      ) {
        assignTo = req.body.assignToSjbtUser;
      }

      const adminExist = await this.AdminModel.findOne({
        _id: assignTo,
        isDeleted: false,
        isActive: true,
      });

      if (adminExist) {
        const { userName } = adminExist;
        const dataToBeUpdate = {
          assignedToName: userName,
          assignedToId: assignTo,
          assignedOnDate: currentDate,
          assignedByName: req.userData.userName,
          assignedById: req.userData.Id,
        };

        const updatePanApplication = await this.panAppModel.findByIdAndUpdate(
          { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
          {
            $set: { ...dataToBeUpdate },
          },
          { new: true }
        );

        if (!updatePanApplication) {
          throw new HttpException("Could not update data.", HttpStatus.OK);
        }

        // const planFlowData = updatePanApplication;
        // planFlowData['panApplicationId'] = updatePanApplication._id.toString();
        // delete planFlowData._id;
        // const updatedPanFlow = await new this.PanAppFlowModel({
        //   ...planFlowData,
        // }).save();

        const panadd = await extractFieldsForPanFlowTable(updatePanApplication);
        const updatedPanFlow = await new this.PanAppFlowModel({
          panApplicationId: updatePanApplication._id,
          ...panadd,
          statusToShow: flowStatus.ASSIGNEE_CHANGED,
        }).save();

        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_ASSIGN_TO",
          requestedId,
          true,
          200,
          `${requestedType} ${req.userData.userName} assigned pan application at ${currentDate}.`,
          "Data found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Application  successfully assigned to ${userName}.`,
          status: true,
          data: updatePanApplication,
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException("Invalid sjbt user.", HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.userName || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_ASSIGN_TO",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.userName || ""
        } tried to assign pan application .`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * all with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------
  async history(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let limit = req.body.limit;
      let page = req.body.page;
      let orderBy = req.body.orderBy;
      let orderByValue = req.body.orderByValue;
      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;
      const filterBy = req.body.filterBy;
      const rangeFilterBy = req.body.rangeFilterBy;
      const isPaginationRequired: boolean =
        req.body.isPaginationRequired === "false" ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        "_id",
        "name",
        "email",
        "mobileNumber",
        "srn",
        "uniqueTransactionId",
        "status",
        "paymentCategory",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let matchQuery: { $and: any[] } = { $and: [] };
      if (requestedType === Role.DISTRIBUTOR) {
        matchQuery = {
          $and: [
            {
              $or: [
                { appliedById: req.userData.Id },
                { distributorCode: req.userData.sjbtCode },
              ],
            },
            { isDeleted: false },
            {
              $or: [
                { status: { $ne: status.BLANK } },
                {
                  $and: [
                    { status: status.BLANK },
                    {
                      $expr: {
                        $gte: [
                          {
                            $toDate: "$appliedOnDate",
                          },
                          sevenDaysAgo,
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        };
      } else {
        matchQuery = {
          $and: [
            {
              $or: [
                { appliedById: req.userData.Id },
                // { distributorCode: req.userData.sjbtCode },
              ],
            },
            { isDeleted: false },
            {
              $or: [
                { status: { $ne: status.BLANK } },
                {
                  $and: [
                    { status: status.BLANK },
                    {
                      $expr: {
                        $gte: [
                          {
                            $toDate: "$appliedOnDate",
                          },
                          sevenDaysAgo,
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        };
      }
      /**
       * to send only active data on web
       */

      limit = parseInt(limit);
      page = parseInt(page);

      if (
        limit === undefined ||
        !limit ||
        limit < 1 ||
        Math.sign(limit) === -1
      ) {
        limit = 10;
      }

      if (page === undefined || !page || page < 1 || Math.sign(page) === -1) {
        page = 1;
      }

      if (
        orderBy === undefined ||
        orderBy === "" ||
        typeof orderBy !== "string"
      ) {
        orderBy = "appliedOnDate";
      }

      if (
        orderByValue === undefined ||
        orderByValue === "" ||
        isNaN(parseInt(orderByValue))
      ) {
        orderByValue = -1;
      }

      const skip = page * limit - limit;

      //check search keys valid

      if (searchIn === undefined) {
        searchIn = [];
      } else if (!Array.isArray(searchIn)) {
        throw new HttpException(`params must be an array`, HttpStatus.OK);
      } else if (searchIn.length) {
        for (const key in searchIn) {
          if (searchIn[key] === "") {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK
            );
          }
        }
      }
      //check search keys valid
      //----------------------------
      //searchQuery
      const searchQuery = [];

      if (
        searchValue !== undefined &&
        searchValue !== "" &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: "i" };
        for (const each in searchKeys) {
          const key = searchKeys[each];
          const val = value;
          searchQuery.push({ [key]: val });
        }
      }

      //searchQuery
      //----------------------------

      if (
        rangeFilterBy !== undefined &&
        rangeFilterBy !== null &&
        typeof rangeFilterBy === "object"
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== "" &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === "string"
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== "" &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== "" &&
              rangeFilterBy.rangeEnd !== null &&
              !isNaN(parseFloat(rangeFilterBy.rangeEnd))
            ) {
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $gte: rangeFilterBy.rangeInitial,
                },
              });
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $lte: rangeFilterBy.rangeEnd,
                },
              });
            }
          }
        }
      }

      //----------------------------
      const invalidData = ["null", null, undefined, "undefined", ""];
      const booleanFields = [];
      const numberFileds = [];

      if (filterBy !== undefined) {
        if (!Array.isArray(filterBy)) {
          throw new HttpException(`filterBy must be an array.`, HttpStatus.OK);
        }
        if (filterBy.length > 0) {
          for (const each in filterBy) {
            if (!invalidData.includes(filterBy[each].fieldName)) {
              if (Array.isArray(filterBy[each].value)) {
                if (filterBy[each].value.length) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: { $in: filterBy[each].value },
                  });
                }
              } else if (filterBy[each].value !== "") {
                if (
                  typeof filterBy[each].value === "string" &&
                  !booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: filterBy[each].value,
                  });
                } else if (
                  numberFileds.includes(filterBy[each].fieldName) &&
                  !isNaN(parseInt(filterBy[each].value))
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: parseInt(filterBy[each].value),
                  });
                } else if (
                  typeof filterBy[each].value === "boolean" ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === "true"
                        ? true
                        : false,
                  });
                }
              }
            }
          }
        }
      }
      //----------------------------
      //calander filter
      /**
       *
       * ToDo : for date filter
       *
       */

      const allowedDateFiletrKeys = ["createdAt", "updatedAt", "appliedOnDate"];
      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== null &&
          dateFilter.dateFilterKey !== ""
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK
            );
          }
        } else {
          dateFilter.dateFilterKey = "appliedOnDate";
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null &&
          dateFilter.end_date !== "" &&
          (dateFilter.start_date === undefined || dateFilter.start_date === "")
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (dateFilter.start_date !== "" && dateFilter.end_date !== "") {
          dateFilter.start_date = new Date(`${dateFilter.start_date}`);
          dateFilter.end_date = new Date(`${dateFilter.end_date}`);
          dateFilter.start_date.setHours(0, 0, 0, 0);
          dateFilter.end_date.setHours(23, 59, 59, 999);
          if (dateFilter.dateFilterKey !== "createdAt") {
            dateFilter.start_date = moment(dateFilter.start_date)
              .add(5, "hours")
              .startOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            dateFilter.end_date = moment(dateFilter.end_date)
              .endOf("day")
              .format("YYYY-MM-DD HH:mm:ss");

            filterQuery.push({
              [`${dateFilter.dateFilterKey}`]: {
                $gte: dateFilter.start_date,
                $lte: dateFilter.end_date,
              },
            });
          } else {
            filterQuery.push({
              $expr: {
                $and: [
                  {
                    $gte: [
                      {
                        $convert: {
                          input: `$${dateFilter.dateFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.start_date}`),
                    ],
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: `$${dateFilter.dateFilterKey}`,
                          to: "date",
                        },
                      },
                      new Date(`${dateFilter.end_date}`),
                    ],
                  },
                ],
              },
            });
          }
        }
      }

      //calander filter
      //----------------------------

      //search query-----------

      if (searchQuery.length > 0) {
        matchQuery.$and.push({ $or: searchQuery });
      }

      //search query-----------
      //----------------for filter

      if (filterQuery.length > 0) {
        for (const each in filterQuery) {
          matchQuery.$and.push(filterQuery[each]);
        }
      }
      const countQuery = [];
      const additionaQuery = [];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "PAN_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.panAppModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No application found.`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === "" ? totalData : limit));
      } else {
        limit = totalData;
      }

      query.push(...additionaQuery, {
        $match: matchQuery,
      });

      query.push({ $sort: { [orderBy]: parseInt(orderByValue) } });
      if (isPaginationRequired) {
        query.push({ $skip: skip });
        query.push({ $limit: limit });
      }

      const result = await this.panAppModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_FILTER_PAGINATION_WEB",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view PAN application at ${currentDate}.`,
          "Application Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Application Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No application found.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_FILTER_PAGINATION_WEB",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to filter data with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * find PAN with srn
   */
  //-------------------------------------------------------------------------

  async findOneWithSrn(srn: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        $and: [
          { srn: srn },
          // { appliedById: req.userData.Id },
          { isDeleted: false },
          // {
          //   $or: [
          //     {
          //       appliedAsType: req.userData.type,
          //       appliedByType: req.userData.type,
          //     },
          //   ],
          // },
        ],
      };

      const applicationFound = await this.panAppModel.findOne({
        ...query,
      });
      if (!applicationFound) {
        throw new HttpException(
          "No application found with entered SRN.",
          HttpStatus.OK
        );
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_VIEW_WITH_SRN",
        applicationFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } view PAN application with ${srn} at ${currentDate}.`,
        "Application found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Application found successfully with entered SRN.",
        status: true,
        data: applicationFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_VIEW_WITH_SRN",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } view PAN application with ${srn} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /**
   * download zip of all files in application
   */
  //-------------------------------------------------------------------------

  async downloadZip(srn: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const applicationFound = await this.panAppModel.findOne({
        srn: srn,
        isDeleted: false,
      });

      if (!applicationFound) {
        throw new HttpException(
          "No application found with entered SRN.",
          HttpStatus.OK
        );
      }

      if (applicationFound.status === status.CANCELLED) {
        throw new HttpException(
          "This application is cancelled.",
          HttpStatus.OK
        );
      }

      // //round robin flow
      // let filesFound = await this.ZipFileModel.find();
      // let currentUsed = filesFound.findIndex((el) => el.lastUsed);
      // let nextIndex = currentUsed + 1;
      // if (filesFound.length - 1 == currentUsed) {
      //   nextIndex = 0;
      // }
      // let fileToUse = filesFound[nextIndex];
      // await this.ZipFileModel.updateOne(
      //   { lastUsed: true },
      //   { $set: { lastUsed: false } }
      // );
      // await this.ZipFileModel.updateOne(
      //   { _id: fileToUse._id },
      //   { $set: { lastUsed: true } }
      // );

      // //get index of lastUsed file
      // const indexOfLastUsed = filesFound.findIndex(
      //   (file) => file.lastUsed === true
      // );

      // // get next file after lastused
      // let filePath;
      // if (indexOfLastUsed === filesFound.length - 1) {
      //   filePath = filesFound[0].filePath;
      // } else {
      //   filePath = filesFound[indexOfLastUsed + 1].filePath;
      // }
      const dataToArchive = [
        {
          url: applicationFound.passportPhotoUrl,
          fileName: "passport-photo",
        },
        {
          url: applicationFound.signaturePhotoUrl,
          fileName: "signature-photo",
        },
        {
          url: applicationFound.panFormFrontPhotoUrl,
          fileName: "pan-form-front",
        },
        {
          url: applicationFound.panFormBackPhotoUrl,
          fileName: "pan-form-back",
        },
        {
          url: applicationFound.panCardFront,
          fileName: "pan-card-front",
        },
        {
          url: applicationFound.adhaarFrontPhotoUrl,
          fileName: "uid-front",
        },
        {
          url: applicationFound.adhaarBackPhotoUrl,
          fileName: "uid-back",
        },

        // {
        //   url: filePath,
        //   fileName: "pdf-file",
        // },
      ];

      if (applicationFound.otherDocuments.length) {
        const otherFileData = applicationFound.otherDocuments.reduce(
          (acc, ele) => {
            dataToArchive.push({
              url: ele.imageUrl,
              fileName: ele.title,
            });

            return acc;
          },
          []
        );
      }

      const filterdData = dataToArchive.filter((el) => {
        return (
          el.url !== "" &&
          el.url !== null &&
          el.url !== undefined &&
          el.fileName !== "" &&
          el.fileName !== null &&
          el.fileName !== undefined
        );
      });

      // Assuming you have an array of URLs stored in a variable called `urls`

      // Create a new instance of JSZip
      const zip = new JSZip();

      // Loop through the array of URLs
      for (const each in filterdData) {
        const url = filterdData[each].url;
        const filePathSplit = url.split(".");
        const fileExt = filePathSplit.pop();
        const fileName = filterdData[each].fileName + `.${fileExt}`;
        // Use axios to download the file
        const response = await axios.default.get(url, {
          responseType: "arraybuffer",
        });

        // Add the file to the zip archive
        const filename = path.basename(url); // Extract the filename from the URL
        zip.file(filename, response.data);
      }

      // Generate the zip archive
      let zipData = await zip.generateAsync({ type: "nodebuffer" });

      // let folderPath = `${ process.env.LOCAL }public/zip-folder`;

      // Create a temporary file to hold the zip archive
      const folderPath = path.join(
        __dirname,
        "../../..",
        "public",
        "zip-folder"
      );

      // let folderPath = path.join( process.env.LOCAL, 'public', 'zip-folder' );
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const tempFilePath = path.join(folderPath, `${srn}.zip`);

      fs.writeFileSync(tempFilePath, zipData);
      zipData = Buffer.alloc(0);
      const path_array = tempFilePath.split("public");
      const newFolderPath = `${process.env.LOCAL}public${
        path_array[path_array.length - 1]
      }`;

      // Send the file to the client for download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=archive.zip");

      // let folderPath = `${ process.env.LOCAL }public/zip-folder`;

      res.sendFile(tempFilePath);

      // Delete the temporary file

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_APPLICATION",
        "PAN_APPLICATION_DOWNLOAD_ZIP",
        applicationFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } requested to download zip folder of PAN application with ${srn} at ${currentDate}.`,
        "Zip created.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Zip created.",
        status: true,
        data: newFolderPath,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_DOWNLOAD_ZIP",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } requested to download zip folder of PAN application with ${srn} at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * paymnet history
   */
  //-------------------------------------------------------------------------
  async paymentHistory(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let limit = req.body.limit;
      let page = req.body.page;
      let orderBy = req.body.orderBy;
      let orderByValue = req.body.orderByValue;
      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;
      const filterBy = req.body.filterBy;
      const rangeFilterBy = req.body.rangeFilterBy;
      const isPaginationRequired: boolean =
        req.body.isPaginationRequired === "false" ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        "_id",
        "name",
        "mobileNumber",
        "srn",
        "paymentStatus",
        "uniqueTransactionId",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
      };

      /**
       * to send only active data on web
       */

      limit = parseInt(limit);
      page = parseInt(page);

      if (
        limit === undefined ||
        !limit ||
        limit < 1 ||
        Math.sign(limit) === -1
      ) {
        limit = 10;
      }

      if (page === undefined || !page || page < 1 || Math.sign(page) === -1) {
        page = 1;
      }

      if (
        orderBy === undefined ||
        orderBy === "" ||
        typeof orderBy !== "string"
      ) {
        orderBy = "createdAt";
      }

      if (
        orderByValue === undefined ||
        orderByValue === "" ||
        isNaN(parseInt(orderByValue))
      ) {
        orderByValue = -1;
      }

      const skip = page * limit - limit;

      //check search keys valid

      if (searchIn === undefined) {
        searchIn = [];
      } else if (!Array.isArray(searchIn)) {
        throw new HttpException(`params must be an array`, HttpStatus.OK);
      } else if (searchIn.length) {
        for (const key in searchIn) {
          if (searchIn[key] === "") {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK
            );
          }
        }
      }
      //check search keys valid
      //----------------------------
      //searchQuery
      const searchQuery = [];

      if (
        searchValue !== undefined &&
        searchValue !== "" &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: "i" };
        for (const each in searchKeys) {
          const key = searchKeys[each];
          const val = value;
          searchQuery.push({ [key]: val });
        }
      }
      //searchQuery
      //----------------------------

      if (
        rangeFilterBy !== undefined &&
        rangeFilterBy !== null &&
        typeof rangeFilterBy === "object"
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== "" &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === "string"
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== "" &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== "" &&
              rangeFilterBy.rangeEnd !== null &&
              !isNaN(parseFloat(rangeFilterBy.rangeEnd))
            ) {
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $gte: rangeFilterBy.rangeInitial,
                },
              });
              filterQuery.push({
                [`${rangeFilterBy.rangeFilterKey}`]: {
                  $lte: rangeFilterBy.rangeEnd,
                },
              });
            }
          }
        }
      }

      //----------------------------
      const invalidData = ["null", null, undefined, "undefined", ""];
      const booleanFields = [];
      const numberFileds = [];

      if (filterBy !== undefined) {
        if (!Array.isArray(filterBy)) {
          throw new HttpException(`filterBy must be an array.`, HttpStatus.OK);
        }
        if (filterBy.length > 0) {
          for (const each in filterBy) {
            if (!invalidData.includes(filterBy[each].fieldName)) {
              if (Array.isArray(filterBy[each].value)) {
                if (filterBy[each].value.length) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: { $in: filterBy[each].value },
                  });
                }
              } else if (filterBy[each].value !== "") {
                if (
                  typeof filterBy[each].value === "string" &&
                  !booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: filterBy[each].value,
                  });
                } else if (
                  numberFileds.includes(filterBy[each].fieldName) &&
                  !isNaN(parseInt(filterBy[each].value))
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]: parseInt(filterBy[each].value),
                  });
                } else if (
                  typeof filterBy[each].value === "boolean" ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === "true"
                        ? true
                        : false,
                  });
                }
              }
            }
          }
        }
      }
      //----------------------------
      //calander filter
      /**
       *
       * ToDo : for date filter
       *
       */

      const allowedDateFiletrKeys = ["createdAt", "updatedAt"];

      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== null &&
          dateFilter.dateFilterKey !== ""
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK
            );
          }
        } else {
          dateFilter.dateFilterKey = "createdAt";
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null &&
          dateFilter.end_date !== "" &&
          (dateFilter.start_date === undefined || dateFilter.start_date === "")
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (
          dateFilter.start_date !== "" &&
          dateFilter.end_date !== "" &&
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== null &&
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null
        ) {
          dateFilter.start_date = new Date(`${dateFilter.start_date}`);
          dateFilter.end_date = new Date(`${dateFilter.end_date}`);
          dateFilter.start_date.setHours(0, 0, 0, 0);
          dateFilter.end_date.setHours(23, 59, 59, 999);

          filterQuery.push({
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $convert: {
                        input: `$${dateFilter.dateFilterKey}`,
                        to: "date",
                      },
                    },
                    new Date(`${dateFilter.start_date}`),
                  ],
                },
                {
                  $lte: [
                    {
                      $convert: {
                        input: `$${dateFilter.dateFilterKey}`,
                        to: "date",
                      },
                    },
                    new Date(`${dateFilter.end_date}`),
                  ],
                },
              ],
            },
          });
        }
      }

      //calander filter
      //----------------------------

      //search query-----------

      if (searchQuery.length > 0) {
        matchQuery.$and.push({ $or: searchQuery });
      }

      //search query-----------
      //----------------for filter

      if (filterQuery.length > 0) {
        for (const each in filterQuery) {
          matchQuery.$and.push(filterQuery[each]);
        }
      }
      const countQuery = [];
      const additionaQuery = [
        {
          $group: {
            _id: "$uniqueTransactionId",
            doc: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$doc",
          },
        },
        {
          $lookup: {
            from: "transactions",
            localField: "uniqueTransactionId",
            foreignField: "uniqueTransactionId",
            as: "transactions",
          },
        },
        {
          $unwind: {
            path: "$transactions",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            paymentStatus: "$transactions.paymentStatus",
          },
        },
        {
          $unset: "transactions",
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.PanAppFlowModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === "" ? totalData : limit));
      } else {
        limit = totalData;
      }

      query.push(...additionaQuery, {
        $match: matchQuery,
      });

      query.push({ $sort: { [orderBy]: parseInt(orderByValue) } });
      if (isPaginationRequired) {
        query.push({ $skip: skip });
        query.push({ $limit: limit });
        query.push({
          $project: {
            _id: 1,
            name: 1,
            mobileNumber: 1,
            srn: 1,
            paymentStatus: 1,
            uniqueTransactionId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        });
      }

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "PAN_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      const result = await this.PanAppFlowModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_PAYMENT_HISTORY",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter payment history of  pan application at ${currentDate}.`,
          "Data found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Data Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_PAYMENT_HISTORY",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter payment history of pan application with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * list status history
   */
  //-------------------------------------------------------------------------
  async getStatusHistory(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let applicationId = id;

      let pendingApplication = await this.PanAppFlowModel.find(
        {
          panApplicationId: applicationId,
          status: { $ne: status.BLANK },
        }
        // ).sort({ createdAt: 1 }
      );

      if (pendingApplication.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "PAN_APPLICATION",
          "PAN_APPLICATION_STATUS_HISTORY",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } viewed history of  PAN application status at ${currentDate}.`,
          "Application Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: pendingApplication,
          status: true,
          message: "Application Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No application found.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_APPLICATION",
        "PAN_APPLICATION_STATUS_HISTORY",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.Id || ""
        }tried to get data with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
