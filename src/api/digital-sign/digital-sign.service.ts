/* eslint-disable prefer-const */
import { UpdateDigitalSignDto } from "./dto/update-digital-sign.dto";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  status,
  DigitalSign,
  DigitalSignDocument,
} from "./entities/digital-sign.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowDocument,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
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
  isMobileValid,
  isvalidUrl,
} from "../../helper/basicValidation";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import { extractFieldsForDSCFlowTable } from "../../helper/createNewEntryOfAppInFlow";
import { generateSRN } from "../../helper/otpGenerate.helper";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { serviceType } from "../price-config/entities/price-config.entity";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
/***/
import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import * as axios from "axios";
import { postApplication } from "../../helper/postApplication";
import { adminHelper } from "../admin/admin.helper";
import { userAuthHelper } from "../../auth/auth.helper";
import { fieldsToBeUpdate } from "../../helper/fieldsToUpdate";
import { statusWiseApplications } from "../../helper/statusWiseApplications";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { DigitalSignHelper } from "./digital-sign.helper";
import { applicationType } from "../rewardHistory/entities/rewardHistory.entity";
import { TransactionService } from "../transaction/transaction.service";
import {
  paymentStatus,
  transactionFor,
  Transaction,
  TransactionDocument,
} from "../transaction/entities/transaction.entity";
import { paytmFunctions } from "../../helper/payment-gateway";
import { EmailService } from "../../helper/sendEmail";
import { smsTemplateService } from "../../helper/smsTemplates";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import {
  ZipFile,
  ZipFileDocument,
} from "../create-zip/entities/create-zip.entity";
import { WhatsappMsgService } from "../../helper/sendWhatsApp";
import { flowStatus } from "../panapplications/entities/pan.entity";

/***/

@Injectable()
export class digitalSignService {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalSign.name)
    private DigitalSignModel: Model<DigitalSignDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(DigitalSignFlow.name)
    private readonly DigitalSignFlowModel: Model<DigitalSignFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly postApplication: postApplication,
    @InjectModel(RejectionList.name)
    private readonly RejectionModel: Model<RejectionListDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    @InjectModel(ZipFile.name)
    private readonly ZipFileModel: Model<ZipFileDocument>,
    @InjectModel(Transaction.name)
    private readonly TransactionModel: Model<TransactionDocument>,
    private readonly adminHelper: adminHelper,
    private readonly userAuthHelper: userAuthHelper,
    private readonly DigitalSignHelper: DigitalSignHelper,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly TransactionService: TransactionService,
    private readonly paytmFunctions: paytmFunctions,
    private readonly EmailService: EmailService,
    private readonly smsTemplateService: smsTemplateService,
    private readonly WhatsappMsgService: WhatsappMsgService
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new DigitalSign
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        propritorName,
        srn,
        email,
        mobileNumber,
        adhaarNumber,
        address,
        photoUrl,
        adhaarCardPhotoUrl,
        panCardPhotoUrl,
        otherDocuments,
        appliedBy,
        appliedAs,
        txnId,
        payementDetails,
        appliedFrom,
        version,
        status,
        assignedTo,
        assignedBy,
        IsAgreedToTermsAndConditions,
        isRefundApplied,
        isRewardApplied,
      } = req.body;

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      /**
       * validat request body data and return object of valid req.body
       */
      const isDataValid =
        await this.DigitalSignHelper.dscApplicationValidations(req);

      if (!isDataValid.status) {
        return res.status(isDataValid.statusCode).send({ ...isDataValid.data });
      }

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();

      //get full address ofuser
      let fullAddress = await this.DigitalSignHelper.getCurrentAddressOfUser(
        req.userData.Id
      );

      const dataToBeInsert = {
        appliedByUserCurrentAddress: fullAddress,
        srn: generateSRN(serviceType.DSC),
        uniqueTransactionId: uniqueTransactionId,
        rewardWalletAmountApplied: 0,
        refundWalletAmountApplied: 0,
        ...isDataValid.data,
      };

      const priceConfigs = await this.DigitalSignHelper.getAmount(
        dataToBeInsert.appliedAsType
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
       */
      let { totalAmount, convinienceCharges, basePrice } = priceConfigs.data;

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
        let isRefundExist = await this.DigitalSignHelper.getRefundAmount(
          requestedId
        );
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
        dataToBeInsert["refundWalletAmountApplied"] = walletUsed;
      }

      /**
       * get reward wallet discount amount function call
       * use userandservicewiserewardconfigs userrewardwallets
       */

      if (isRewardApplied) {
        let isRewardExist = await this.DigitalSignHelper.getRewardAmount(
          requestedId
        );
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
      dataToBeInsert["basePrice"] = basePrice;
      const redirectToPaymentGateway = totalAmount > 0 ? true : false;
      const statusOfPayment =
        totalAmount > 0 ? paymentStatus.PENDING : paymentStatus.SUCCESS;
      dataToBeInsert["txnStatus"] = statusOfPayment;
      dataToBeInsert["status"] = redirectToPaymentGateway
        ? "PAYMENT_PENDING"
        : "PENDING";
      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      const dscApplied = await new this.DigitalSignModel({
        ...dataToBeInsert,
      }).save();

      if (!dscApplied) {
        throw new HttpException(
          "Unable to add dsc application.",
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
            applicationId: dscApplied._id,
            applicationType: serviceType.DSC,
            srn: dataToBeInsert.srn,
          },
        ],
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: dataToBeInsert["totalPrice"],
        remark: `Transaction created for dsc application having SRN ${
          dataToBeInsert.srn
        } on ${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")} `,
        reqData: [],
        resData: [],
      };

      // return res.status(200).send({
      //   message: 'DSC application applied successfully.',
      //   status: true,
      //   data: dscApplied,
      //   code: 'CREATED',
      //   issue: null,
      // });

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

        //-------------send refrence number to email Id-------------//
        let emailId =
          requestedType === Role.GUEST
            ? req.body.email
            : req.userData.userEmail;
        let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
          {
            applicationType: serviceType.DSC,
            name: dscApplied.propritorName.toUpperCase(),
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
        const deleteApplication = await this.DigitalSignModel.findOneAndDelete({
          uniqueTransactionId: uniqueTransactionId,
        });
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DIGITAL_SIGN_APPLICATION",
          "DIGITAL_SIGN_APPLICATION_ADD",
          req.userData.mobileNumber,
          true,
          200,
          `${requestedType}${req.userData?.contactNumber || ""} applied for ${
            dscApplied.srn
          } DSC application at ${currentDate}.`,
          "DSC application applied successfully.",
          req.socket.remoteAddress
        );

        throw new HttpException(
          "Unable to initiate transaction. Please try again.",
          HttpStatus.OK
        );
      }
      const dscAdd = await extractFieldsForDSCFlowTable(dscApplied);
      const updatedPanFlow = await new this.DigitalSignFlowModel({
        digitalSignId: dscApplied._id,
        ...dscAdd,
      }).save();

      //-------------send refrence number to email Id-------------//
      // let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
      //   {
      //     name: req.userData.userName.toUpperCase(),
      //     refNo: dataToBeInsert.srn,
      //   },
      //   req.body.userEmail,
      // );

      // if (!sendEmailOtp || !sendEmailOtp['sendStatus']) {
      //   throw new HttpException(
      //     "Couldn't send otp on email. Please try again.",
      //     HttpStatus.OK,
      //   );
      // }

      // let msg91Data = {
      //   template_id: process.env.MSG91_REFNO_TEMPLATE_ID,
      //   sender: process.env.MSG91_SENDER_ID,
      //   short_url: '0',
      //   mobiles: '+91' + req.userData.contactNumber,
      //   name: req.userData.userName.toUpperCase(),
      //   refno: dscApplied.srn,
      // };

      // const msgSent: any = await sendMsg91Function(msg91Data);

      // if (!msgSent || !msgSent.sendStatus) {
      //   console.log(msgSent.sendStatus);
      // }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DSC_APPLICATION",
        "DSC_APPLICATION_ADD",
        dscApplied._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } applied for DSC ${dscApplied.srn} at ${currentDate}.`,
        "DSC application applied successfully.",
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
            serviceType.DSC,
            dscApplied._id,
            req.userData.type,
            uniqueTransactionId,
            req,
            dataToBeInsert.srn
          );
      }

      if (
        // dscApplied.appliedAsType !== Role.GUEST &&
        // dscApplied.appliedByType !== Role.GUEST &&
        isRewardToBeUpdate === true
      ) {
        const rewardWalletUpdate =
          await this.postApplication.updateRewardWalletForCart(
            dataToBeInsert["rewardWalletAmountApplied"],
            updateRewardWallet,
            req.userData.Id,
            serviceType.DSC,
            dscApplied._id,
            dscApplied.srn,
            uniqueTransactionId,
            req
          );
      }

      return res.status(200).send({
        message: "DSC application saved successfully.",
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_ADD",
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to add DSC application with this ${req.userData.mobileNumber}.`,
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
      let applicationFound = await this.DigitalSignModel.findOne({
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
        let isRefundExist = await this.DigitalSignHelper.getRefundAmount(
          requestedId
        );

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
        let isRewardExist = await this.DigitalSignHelper.getRewardAmount(
          requestedId
        );
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
      applicationDataToUpdate["txnStatus"] = statusOfPayment;
      applicationDataToUpdate["status"] = redirectToPaymentGateway
        ? "PAYMENT_PENDING"
        : "PENDING";

      applicationDataToUpdate["totalPrice"] = parseFloat(
        totalAmount.toString()
      ).toFixed(2);

      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      const dscApplied = await this.DigitalSignModel.findOneAndUpdate(
        {
          srn: srn,
          isDeleted: false,
        },
        { $set: { ...applicationDataToUpdate } },
        { new: true }
      );

      if (!dscApplied) {
        throw new HttpException(
          "Unable to add dsc application.",
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
            applicationId: dscApplied._id,
            applicationType: serviceType.DSC,
            srn: applicationFound.srn,
          },
        ],
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: applicationFound["totalPrice"],
        remark: `Transaction created for dsc application having SRN ${
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
        applicationDataToUpdate["uniqueTransactionId"] = orderId;
      } else {
        resDataToSend.paymentGatewayData["orderId"] =
          applicationFound.uniqueTransactionId;
        resDataToSend.paymentGatewayData["token"] = null;
        resDataToSend.paymentGatewayData["amount"] =
          applicationFound["totalPrice"];
        resDataToSend.paymentGatewayData["tokenType"] = null;

        //-----------update appliedon Date time of application----------//

        const updateApplication = await this.DigitalSignModel.findByIdAndUpdate(
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
        const deleteApplication = await this.DigitalSignModel.findOneAndDelete({
          uniqueTransactionId: applicationFound.uniqueTransactionId,
        });
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DIGITAL_SIGN_APPLICATION",
          "DSC_APPLICATION_RETRY_SERVICE_PAYMENT",
          req.userData.contactNumber,
          true,
          200,
          `${requestedType}${req.userData?.contactNumber || ""} applied for ${
            dscApplied.srn
          } DSC application at ${currentDate}.`,
          "DSC application applied successfully.",
          req.socket.remoteAddress
        );

        throw new HttpException(
          "Unable to initiate transaction. Please try again.",
          HttpStatus.OK
        );
      }
      const dscAdd = await extractFieldsForDSCFlowTable(dscApplied);
      const updatedPanFlow = await new this.DigitalSignFlowModel({
        digitalSignId: dscApplied._id,
        ...dscAdd,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DSC_APPLICATION",
        "DSC_APPLICATION_RETRY_SERVICE_PAYMENT",
        dscApplied._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } applied for DSC ${dscApplied.srn} at ${currentDate}.`,
        "DSC application applied successfully.",
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
            serviceType.DSC,
            dscApplied._id,
            req.userData.type,
            applicationFound.uniqueTransactionId,
            req,
            applicationFound.srn
          );
      }

      if (
        // dscApplied.appliedAsType !== Role.GUEST &&
        // dscApplied.appliedByType !== Role.GUEST &&
        isRewardToBeUpdate === true
      ) {
        const rewardWalletUpdate =
          await this.postApplication.updateRewardWalletForCart(
            applicationDataToUpdate["rewardWalletAmountApplied"],
            updateRewardWallet,
            req.userData.Id,
            serviceType.DSC,
            dscApplied._id,
            dscApplied.srn,
            applicationFound.uniqueTransactionId,
            req
          );
      }

      return res.status(200).send({
        message: "DSC application applied successfully.",
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_RETRY_SERVICE_PAYMENT",
        req.userData.contactNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.contactNumber || ""
        } tried to retry paymnent of  DSC application with this ${
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
   * find all DigitalSigns
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const dataFound = await this.DigitalSignModel.find({ isDeleted: false });
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list of digital signature application at ${currentDate}.`,
        `list digital signature .`,
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
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.Id || ""} ${
          req.userData?.Id || ""
        } tried to check list of digital signature with this credentials at ${moment()
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
   * find DigitalSign with srn
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

      const digitalSignFound = await this.DigitalSignModel.findOne({
        ...query,
      });

      if (!digitalSignFound) {
        throw new HttpException(
          "No application found with entered SRN.",
          HttpStatus.OK
        );
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_VIEW_WITH_SRN",
        digitalSignFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } view digital signature with ${srn} at ${currentDate}.`,
        "Application found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Application found successfully with entered SRN.",
        status: true,
        data: digitalSignFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_VIEW_WITH_SRN",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } view digital signature with ${srn} with this credentials at ${moment()
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
   * find DigitalSign
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let query: any = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          $and: [
            // { appliedById: req.userData.Id },
            { _id: new mongoose.Types.ObjectId(id) },
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
      }
      let projectQuery = {};
      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "DSC_APPLICATIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const digitalSignFound = await this.DigitalSignModel.findOne(
        { ...query },
        projectQuery
      );

      if (!digitalSignFound) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } view digital signature ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: digitalSignFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_VIEW",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } view digital signature ${id} with this credentials at ${moment()
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
   * update DigitalSign
   */
  //-------------------------------------------------------------------------

  async update_by_id(
    id: string,
    UpdateDigitalSignDto: UpdateDigitalSignDto,
    res,
    req
  ) {
    try {
      const {
        propritorName,
        srn,
        email,
        mobileNumber,
        adhaarNumber,
        address,
        photoUrl,
        adhaarCardPhotoUrl,
        panCardPhotoUrl,
        otherDocuments,
        appliedBy,
        appliedAs,
        txnId,
        payementDetails,
        appliedFrom,
        version,
        status,
        assignedTo,
        assignedBy,
        IsAgreedToTermsAndConditions,
      } = req.body;

      const reqParams = [
        "propritorName",
        "srn",
        "email",
        "mobileNumber",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedBy",
        "appliedAs",
        "txnId",
        "payementDetails",
        "version",
        "acknowledgementNumber",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "otherDocuments",
        "version",
      ];

      const requiredKeys = [
        "propritorName",
        "email",
        "mobileNumber",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
      ];

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

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const digitalSignFound = await this.DigitalSignModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      if (!digitalSignFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (digitalSignFound.status == "CANCELLED") {
        throw new HttpException(
          "You are not allowed to perform this action.",
          HttpStatus.OK
        );
      }

      if (digitalSignFound.status !== "REJECT") {
        throw new HttpException(
          `You can not update this application, Your application is already in ${digitalSignFound.status}.`,
          HttpStatus.OK
        );
      }

      /**check mobile number is valid or not*/
      if (!isMobileValid(UpdateDigitalSignDto.mobileNumber)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check email is valid or not */
      if (!isEmailValid(UpdateDigitalSignDto.email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      /**check adhar number is valid or not */
      if (
        UpdateDigitalSignDto.adhaarNumber &&
        isAadharValid(UpdateDigitalSignDto.adhaarNumber) === false
      ) {
        throw new HttpException(
          "Aadhar number must be valid number.",
          HttpStatus.OK
        );
      }

      /**check photoUrl is valid or not */
      if (
        UpdateDigitalSignDto.photoUrl &&
        isvalidUrl(UpdateDigitalSignDto.photoUrl) === false
      ) {
        throw new HttpException("Photo url must be valid url.", HttpStatus.OK);
      }

      /**check adhaarCardPhotoUrl is valid or not */
      if (
        UpdateDigitalSignDto.adhaarCardPhotoUrl &&
        isvalidUrl(UpdateDigitalSignDto.adhaarCardPhotoUrl) === false
      ) {
        throw new HttpException(
          "Adhaar card photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check panCardPhotoUrl is valid or not */
      if (
        UpdateDigitalSignDto.panCardPhotoUrl &&
        isvalidUrl(UpdateDigitalSignDto.panCardPhotoUrl) === false
      ) {
        throw new HttpException(
          "DSC card photo url must be valid url.",
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

      const result = await this.DigitalSignModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        {
          $set: { ...req.body, ...fieldsUpdated, ...addMorefieldsToBeUpdate },
        },
        { new: true }
      );

      if (!result) {
        throw new HttpException("Could not update data.", HttpStatus.OK);
      }

      const updatedDscFlowFields = await extractFieldsForDSCFlowTable(result);
      const dscIdInFlowTableId = result._id.toString();

      const updateDscFlow = await new this.DigitalSignFlowModel({
        digitalSignId: dscIdInFlowTableId,
        ...updatedDscFlowFields,
      });
      await updateDscFlow.save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_UPDATE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated digital signature ${digitalSignFound.srn} at ${currentDate}.`,
        "Data updated successfully.!",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data updated successfully.",
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
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update digital signature ${id} with this credentials at ${moment()
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
        "propritorName",
        "mobileNumber",
        "email",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedBy",
        "appliedAs",
        "txnId",
        "payementDetails",
        "paymentCategory",
        "srn",
        "appliedFrom",
        "version",
        "status",
        "assignedTo",
        "assignedBy",
        "appliedByNumber",
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
              if (filterBy[each].fieldName === "status") {
                const adminApplicationAcces =
                  await this.adminHelper.getAdminApplicationAcces(
                    req.userData.Id,
                    serviceType.DSC,
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
      const dataFound = await this.DigitalSignModel.aggregate(countQuery);
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
          "DSC_APPLICATIONS"
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

      const result = await this.DigitalSignModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DIGITAL_SIGNATURE",
          "DIGITAL_SIGNATURE_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data of digital signature at ${currentDate}.`,
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
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data of digital signature with this credentials at ${moment()
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
        "propritorName",
        "mobileNumber",
        "email",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedBy",
        "appliedAs",
        "txnId",
        "payementDetails",
        "paymentCategory",
        "srn",
        "appliedFrom",
        "version",
        "status",
        "assignedTo",
        "assignedBy",
        "appliedByNumber",
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
      const numberFileds = [];

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
                    serviceType.DSC,
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
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
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

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.DigitalSignModel.aggregate(countQuery);
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
          "DSC_APPLICATIONS"
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

      const result = await this.DigitalSignModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DIGITAL_SIGNATURE",
          "DIGITAL_SIGNATURE_STATUS_WISE_FILTER",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data of digital signature status wise at ${currentDate}.`,
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
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_STATUS_WISE_FILTER",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data of digital signature status wise with this credentials at ${moment()
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
      const dateToBeInsert = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const requestedName = req.userData?.userName || "";

      const IdkeyToUpdate = requestedId;
      const NamekeyToUpdate = requestedName;
      const DatekeyToInsert = dateToBeInsert;
      const adminData = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isDeleted: false,
      });

      if (requestedType === "ADMIN" || "SUPER_ADMIN") {
        if (!adminData) {
          throw new HttpException("User not found.", HttpStatus.OK);
        }
      }

      const DscApplicationFound = await this.DigitalSignModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      if (!DscApplicationFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      if (DscApplicationFound.status == status.CANCELLED) {
        throw new HttpException(
          `This application is cancelled.`,
          HttpStatus.OK
        );
      }

      ///check admin have acess for status change

      const checkUpdateaAccess =
        await this.adminHelper.checkAccessForUpdateStatus(
          req,
          serviceType.DSC,
          adminData.applicationStatusAccess
        );

      if (!checkUpdateaAccess.status) {
        throw new HttpException(checkUpdateaAccess.message, HttpStatus.OK);
      }

      const currentstatus = DscApplicationFound.status;

      const activeStatus = changestatusForApp(
        currentstatus,
        req.body.requestedStatus
      );

      let dataToUpdate = {
        status: activeStatus,
        remark: req.body.remark,
      };

      if (req.body.requestedStatus === status.VERIFY) {
        if (req.file === undefined) {
          return res.status(200).send({
            status: false,
            message: "Acknowledgement PDF is required.",
          });
        }

        // if (!req.body.acknowledgementNumber) {
        //   throw new HttpException(
        //     `Acknowledgement number is required.`,
        //     HttpStatus.OK,
        //   );
        // } else {
        // const checkAckNumber = await this.DigitalSignModel.findOne({
        //   acknowledgementNumber: req.body.acknowledgementNumber,
        // });

        // if (checkAckNumber) {
        //   throw new HttpException(
        //     'Acknowledgement number already exist with another application.',
        //     HttpStatus.OK,
        //   );
        // }
        // }

        const path_array = file.path.split("public");
        let imagePath = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;

        dataToUpdate["acknowledgementPdf"] = imagePath;
        dataToUpdate["acknowledgementNumber"] = req.body.acknowledgementNumber;

        /**send acknowledgement pdf through email */
        let user = await this.DigitalSignHelper.getAppliedUser(
          DscApplicationFound.appliedById
        );

        let emailId =
          user.userType === Role.GUEST ? DscApplicationFound.email : user.email;

        const fileName = file.filename;

        let attachments = [
          {
            content: file.path,
            filename: "Acknowledgement.pdf",
          },
        ];

        let sendAttachments = await this.EmailService.sendAcknowledMentTemplate(
          {
            applicationType: serviceType.DSC,
            name: DscApplicationFound.propritorName,
            refNo: DscApplicationFound.srn,
            emailAttachment: attachments,
          },
          emailId
        );

        //---------------------sendwhatsapp-msg-------------------//
        /**send whatsapp msg***/
        // let parameters = [
        //   {
        //     type: "text",
        //     text: DscApplicationFound.propritorName,
        //   },
        //   {
        //     type: "text",
        //     text: DscApplicationFound.srn,
        //   },
        // ];

        // let sendWhatsappMsg =
        //   await this.WhatsappMsgService.sendWhatsAppMsg91Function(
        //     user.mobileNumber,
        //     "APPLICATION_VERIFY",
        //     parameters,
        //     imagePath
        //   );
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
          const applicationsAssignedToUserCount =
            await this.DigitalSignModel.find({
              assignedToId: requestedId,
              status: status.IN_PROGRESS,
            }).count();

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
          DscApplicationFound._id,
          serviceType.DSC,
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

          const latestAssignedApplication =
            await this.DigitalSignFlowModel.find({
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
        DscApplicationFound.status === status.REJECT &&
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

      if (req.body.requestedStatus === status.REJECT) {
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
        let user = await this.DigitalSignHelper.getAppliedUser(
          DscApplicationFound.appliedById
        );
        let msg91Data = {
          template_id: process.env.MSG91_REJECTION_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID,
          short_url: "0",
          mobiles: "+91" + DscApplicationFound.appliedByNumber,
          USERNAME: DscApplicationFound.propritorName.toUpperCase(),
          SRN: DscApplicationFound.srn,
          REJECTION_REASON: req.body.rejectionReason,
          CONTACT_NUMBER: process.env.SJBT_CONTACT_NO,
        };

        const msgSent: any = await sendMsg91Function(msg91Data);

        if (!msgSent || !msgSent.sendStatus) {
          console.log(msgSent.sendStatus);
        }

        /**send rejection email */
        let emailId =
          user.userType === Role.GUEST ? DscApplicationFound.email : user.email;

        let rejectionEmail = await this.EmailService.sendEmailRejectionTemplate(
          {
            applicationType: serviceType.DSC,
            name: DscApplicationFound.propritorName.toUpperCase(),
            rejectionMsg: req.body.rejectionReason,
            refNo: DscApplicationFound.srn,
          },
          emailId
        );

        if (!rejectionEmail) {
          console.log(msgSent.sendStatus);
        }
      }

      const dscUpdate = await this.DigitalSignModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        {
          $set: {
            ...dataToUpdate,
          },
        },
        { new: true }
      );

      const dscAdd = await extractFieldsForDSCFlowTable(dscUpdate);
      const updatedPanFlow = await new this.DigitalSignFlowModel({
        digitalSignId: dscUpdate._id,
        ...dscAdd,
      }).save();

      if (activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DSC_APPLICATION",
          "DSC_APPLICATION_STATUS",
          id,
          true,
          200,
          `${requestedType} ${req.userData.userName} change status of DSC application ${DscApplicationFound.srn} at ${currentDate}.`,
          `Changed status to ${activeStatus.replace(
            /_/g,
            " "
          )} of DSC application ${id} successfully.`,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to change status of DSC ${id} with this credentials at ${moment()
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
      const collection = await this.DigitalSignModel.collection;

      const result = await getApplicationCounts(collection);
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DSC_APPLICATION",
        "DSC_APPLICATION_STATUS_COUNT",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } view status count of DSC application at ${currentDate}.`,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_STATUS_COUNT",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view data of status count with this credentials at ${moment()
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
      if (
        req.body.assignToSjbtUser !== undefined &&
        req.body.assignToSjbtUser !== null &&
        req.body.assignToSjbtUser !== ""
      ) {
        assignTo = req.body.assignToSjbtUser;
      }

      const adminExist = await this.adminModel.findOne({ _id: assignTo });

      if (adminExist) {
        const { userName } = adminExist;
        const dataToBeUpdate = {
          assignedToName: userName,
          assignedToId: assignTo,
          assignedOnDate: currentDate,
          assignedByName: req.userData.userName,
          assignedById: req.userData.Id,
        };

        const updateDscApplication =
          await this.DigitalSignModel.findByIdAndUpdate(
            { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
            {
              $set: { ...dataToBeUpdate },
            },
            { new: true }
          );

        if (!updateDscApplication) {
          throw new HttpException("Could not update data.", HttpStatus.OK);
        }

        const dscAdd = await extractFieldsForDSCFlowTable(updateDscApplication);
        const updatedDscFlow = await new this.DigitalSignFlowModel({
          digitalSignId: updateDscApplication._id,
          ...dscAdd,
          statusToShow: flowStatus.ASSIGNEE_CHANGED,
        }).save();

        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DSC_APPLICATION",
          "DSC_APPLICATION_ASSIGN_TO",
          requestedId,
          true,
          200,
          `${requestedType} ${req.userData.userName} assigned DSC application at ${currentDate}.`,
          "Data found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Application  successfully assigned to ${userName}.`,
          status: true,
          data: updateDscApplication,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_ASSIGN_TO",
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
        "propritorName",
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

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.DigitalSignModel.aggregate(countQuery);
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

      const result = await this.DigitalSignModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DSC_APPLICATION",
          "DSC_APPLICATION_FILTER_PAGINATION_WEB",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view DSC application at ${currentDate}.`,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_FILTER_PAGINATION_WEB",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data with this credentials at ${moment()
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

      const applicationFound = await this.DigitalSignModel.findOne({
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
          url: applicationFound.photoUrl,
          fileName: "passport-photo",
        },
        {
          url: applicationFound.adhaarCardPhotoUrl,
          fileName: "adharcard-photo",
        },
        {
          url: applicationFound.panCardPhotoUrl,
          fileName: "pan-card-photo",
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

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const zipfileName =
        applicationFound.acknowledgementNumber &&
        applicationFound.acknowledgementNumber !== ""
          ? applicationFound.acknowledgementNumber
          : srn;

      const tempFilePath = path.join(folderPath, `${zipfileName}.zip`);

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

      // Delete the temporary file

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DSC_APPLICATION",
        "DSC_APPLICATION_DOWNLOAD_ZIP",
        applicationFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } requested to download zip folder of DSC application with ${srn} at ${currentDate}.`,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_DOWNLOAD_ZIP",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } requested to download zip folder of DIGITAL_SIGN application with ${srn} at ${moment()
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
        "propritorName",
        "srn",
        "paymentStatus",
        "mobileNumber",
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
      const dataFound = await this.DigitalSignFlowModel.aggregate(countQuery);
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
            propritorName: 1,
            srn: 1,
            mobileNumber: 1,
            uniqueTransactionId: 1,
            paymentStatus: 1,
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
          "DSC_APPLICATIONS"
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

      const result = await this.DigitalSignFlowModel.aggregate(query);

      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DIGITAL_SIGNATURE",
          "DIGITAL_SIGNATURE_PAYMENT_HISTORY",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data of digital signature at ${currentDate}.`,
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
        "DIGITAL_SIGNATURE",
        "DIGITAL_SIGNATURE_PAYMENT_HISTORY",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data of digital signature with this credentials at ${moment()
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

      let statusFlow = await this.DigitalSignFlowModel.find({
        digitalSignId: applicationId,
        status: { $ne: status.BLANK },
      }).sort({ createdAt: 1 });

      if (statusFlow.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "DSC_APPLICATION",
          "DSC_APPLICATION_STATUS_HISTORY",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } viewed history of  DSC application status at ${currentDate}.`,
          "Application Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: statusFlow,
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
        "DSC_APPLICATION",
        "DSC_APPLICATION_STATUS_HISTORY",
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
