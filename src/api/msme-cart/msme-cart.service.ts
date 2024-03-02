/* eslint-disable prefer-const */
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  applicationTypes,
  formCategory,
  PanCart,
  PanCartDocument,
} from "../pan-cart/entities/pan-cart.entity";
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
import { transactionFor } from "../transaction/entities/transaction.entity";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import {
  extractFieldsForMsmeFlowTable,
  extractFieldsForPanFlowTable,
} from "../../helper/createNewEntryOfAppInFlow";
import { generateSRN } from "../../helper/otpGenerate.helper";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { User, UserDocument, VerifyStatus } from "../user/entities/user.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import { Role } from "../user-flow/entities/user-flow.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import { adminHelper } from "../admin/admin.helper";
import { postApplication } from "../../helper/postApplication";
import { userAuthHelper } from "../../auth/auth.helper";
import { msmeCartData } from "./msme-cart.helper";
import {
  MsmeCart,
  MsmeCartDocument,
  status,
} from "./entities/msme-cart.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { paytmFunctions } from "../../helper/payment-gateway";
import { TransactionService } from "../transaction/transaction.service";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import { paymentStatus } from "../transaction/entities/transaction.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowDocument,
} from "../msme-application-flow/entities/msme-application-flow.entity";
import { EmailService } from "../../helper/sendEmail";
import { TransactionHelper } from "../transaction/transaction.helper";
@Injectable()
export class msmeCartServices {
  [x: string]: any;
  constructor(
    @InjectModel(MsmeCart.name) private MsmeCartModel: Model<MsmeCartDocument>,
    @InjectModel(MsmeApplicationFlow.name)
    private MsmeApplicationFlowModel: Model<MsmeApplicationFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly msmeCartData: msmeCartData,
    private readonly adminHelper: adminHelper,
    @InjectModel(RejectionList.name)
    private readonly RejectionModel: Model<RejectionListDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly MsmeModel: Model<MsmeApplicationDocument>,
    private readonly postApplication: postApplication,
    private readonly userAuthHelper: userAuthHelper,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly paytmFunctions: paytmFunctions,
    private readonly TransactionService: TransactionService,
    private readonly EmailService: EmailService,
    private readonly TransactionHelper: TransactionHelper
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        propritorName,
        firmName,
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

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const appliedByTypeUserExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!appliedByTypeUserExist) {
        throw new HttpException(`Invalid User.`, HttpStatus.OK);
      }

      if (
        appliedByTypeUserExist.services?.length &&
        !appliedByTypeUserExist.services?.includes(serviceType.MSME)
      ) {
        throw new HttpException(
          `You are not allow to access this MSME service.`,
          HttpStatus.OK
        );
      }

      const distributorCode = req.userData?.sjbtCode || "";

      const distributorExist = await this.userModel.findOne({
        sjbtCode: distributorCode,
        status: VerifyStatus.VERIFIED,
        isActive: true,
        isDeleted: false,
        isVerified: true,
        isBlocked: false,
      });

      if (req.userData.type !== Role.GUEST && !distributorExist) {
        throw new HttpException(
          "Please login with Verified distributor code to apply for application.",
          HttpStatus.OK
        );
      }
      if (req.userData.type === Role.RETAILER) {
        const retailerExist = await this.userModel.findOne({
          _id: new mongoose.Types.ObjectId(req.userData.Id),
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });
        if (retailerExist) {
          req.body.retailerId = retailerExist._id;
          req.body.retailerName = retailerExist.name;
          req.body.retailerFirmName = retailerExist.firmName;
          req.body.retailerFirmAddress = retailerExist.address;
          req.body.retailerMobileNumber = retailerExist.mobileNumber;
          req.body.retailerPanNumber = retailerExist.panNumber;
        }
      }

      const msmeCartItems = await this.msmeCartData.msmeCartItems(
        req.body.msmeCartItems,
        req,
        res
      );

      //get total price
      const checkAmountForUser = await this.msmeCartData.getAmount(
        req.userData.type
      );

      msmeCartItems.forEach((el) => {
        el.srn = generateSRN(serviceType.MSME);
        el.distributorCode = distributorCode;
        el.distributorId = distributorExist ? distributorExist._id : "";
        el.appliedByType = appliedByTypeUserExist.userType;
        el.appliedAsType = req.userData.type;
        el.appliedById = req.userData.Id;
        el.appliedByName = appliedByTypeUserExist.name;
        el.appliedOnDate = moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss");
        el.appliedByNumber = appliedByTypeUserExist.mobileNumber;
        el.status = "PAYMENT_PENDING"; //status enum not working here
        el.totalPrice = checkAmountForUser.data.totalAmount;
        el.applicationIndividualPrice = checkAmountForUser.data.totalAmount;
        el.convinienceCharges = checkAmountForUser.data.convinienceCharges;
        el.basePrice = checkAmountForUser.data.basePrice;
      });

      const cartData = await this.MsmeCartModel.insertMany(msmeCartItems);

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MSME_CART",
        "MSME_CART_ADD",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added msme applications into cart at ${currentDate}.`,
        "Applications successfully added into cart.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Applications added into cart successfully.",
        status: true,
        data: cartData,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "MSME_CART",
        "MSME_CART_ADD",
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to add to cart msme applications with this ${
          req.userData.mobileNumber
        }.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * view user
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query: any = {
        appliedById: req.userData.Id,
        isDeleted: false,
      };

      const msmeCartItemsFound = await this.MsmeCartModel.find(query);

      if (!msmeCartItemsFound.length) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MSME_CART",
        "MSME_CART_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        }viewed cart  ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: msmeCartItemsFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "MSME_CART",
        "MSME_CART_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view cart ${id} with this credentials at ${moment()
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
   * remove cart
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const cartFound = await this.MsmeCartModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!cartFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.MsmeCartModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!dataUpdated) {
        throw new HttpException("Could not delete data.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "MSME_CART",
        "MSME_CART_DELETE",
        id,
        true,
        200,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } updated cart ${id} at ${currentDate}.`,
        "Msme cart deleted successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Deleted successfully.",
        status: true,
        data: null,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "MSME_CART",
        "MSME_CART_DELETE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${id}  tried to delete msme cart with this credentials at ${moment()
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
   * checkout
   */
  //-------------------------------------------------------------------------

  async checkout(req, res) {
    try {
      const { isRefundApplied, isRewardApplied, appliedFrom } = req.body;

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const appliedByTypeUserExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!appliedByTypeUserExist) {
        throw new HttpException(`Invalid User.`, HttpStatus.OK);
      }

      const email = appliedByTypeUserExist.email;
      const mobileNumber = appliedByTypeUserExist.mobileNumber;

      const cartItems = await this.MsmeCartModel.find({
        appliedById: req.userData.Id,
        isDeleted: false,
      });

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();

      const dataToBeInsert = {
        uniqueTransactionId: uniqueTransactionId,
        serialNumber: serialNumber,
        // srn: generateSRN(serviceType.MSME),
        ...cartItems,
      };

      let totalAmountForGateway = 0;
      let refundAmountToBeInsert = 0;
      let rewardAmountToBeInsert = 0;

      //get total amount for all application
      totalAmountForGateway = cartItems.reduce((acc, application) => {
        return acc + application.totalPrice;
      }, 0);

      let updateRefundWallet = 0;
      let updateRewardWallet = 0;
      let isRefundToBeUpdate = false;
      let isRewardToBeUpdate = false;
      let walletUsed = 0;

      //applied refund wallet and get remaining amount

      if (isRefundApplied) {
        let isRefundExist = await this.msmeCartData.getRefundAmount(
          requestedId
        );
        let remainingAmount = totalAmountForGateway;

        if (isRefundExist.status) {
          if (totalAmountForGateway > isRefundExist.data.refundAmount) {
            walletUsed = isRefundExist.data.refundAmount;
            updateRefundWallet = 0;
            remainingAmount =
              totalAmountForGateway - isRefundExist.data.refundAmount;
          } else {
            walletUsed = totalAmountForGateway;

            remainingAmount = 0;
            updateRefundWallet =
              isRefundExist.data.refundAmount - totalAmountForGateway;
          }

          isRefundToBeUpdate = true;
        }
        totalAmountForGateway = remainingAmount;
        refundAmountToBeInsert = walletUsed;
      }

      //applied reward wallet and get remaining amount

      if (isRewardApplied) {
        let isRewardExist = await this.msmeCartData.getRewardAmount(
          requestedId
        );

        let remainingAmount = totalAmountForGateway;
        if (isRewardExist.status) {
          if (totalAmountForGateway > isRewardExist.data.rewardAmount) {
            walletUsed = isRewardExist.data.rewardAmount;
            updateRewardWallet = walletUsed - isRewardExist.data.rewardAmount;
            remainingAmount =
              totalAmountForGateway - isRewardExist.data.rewardAmount;
          } else {
            walletUsed = totalAmountForGateway;
            remainingAmount = 0;
            updateRewardWallet =
              isRewardExist.data.rewardAmount - totalAmountForGateway;
          }
          isRewardToBeUpdate = true;
        }

        totalAmountForGateway = remainingAmount;
        rewardAmountToBeInsert = walletUsed;
      }

      const redirectToPaymentGateway = totalAmountForGateway > 0 ? true : false;
      const statusOfPayment =
        totalAmountForGateway > 0
          ? paymentStatus.PENDING
          : paymentStatus.SUCCESS;
      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      let transactionObjectId = new mongoose.Types.ObjectId();

      //application details for transaction
      let applicationDetails = [];
      let cartApplicationsIds = [];
      const transactionDataToBeAdded = {
        _id: transactionObjectId,
        txnId: "",
        serialNumber: serialNumber,
        uniqueTransactionId: uniqueTransactionId,
        userId: req.userData.Id,
        userType: req.userData.type,
        applicationDetails: applicationDetails,
        cartItemsApplicationIds: cartApplicationsIds,
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: totalAmountForGateway,
        remark: `Transaction created for MSME application on ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")} `,
        reqData: [],
        resData: [],
      };

      if (redirectToPaymentGateway) {
        const paymentInitializeResponse: any =
          await this.paytmFunctions.initiatePayment({
            userId: req.userData.Id,
            totalAmount: totalAmountForGateway,
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
      }

      let cartData;
      let totalAmountOfCart;
      let applicationsSrn = [];

      /** totalAmount of cart**/
      cartItems.forEach(async (el) => {
        totalAmountOfCart = cartItems.reduce((sum, el) => {
          return sum + el.applicationIndividualPrice;
        }, 0);
      });

      if (statusOfPayment == paymentStatus.SUCCESS) {
        // add application with pending status
        cartItems.forEach(async (el) => {
          let refundAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            refundAmountToBeInsert;
          let rewardAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            rewardAmountToBeInsert;
          // let srnToUpdate = generateSRN(serviceType.MSME);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.MSME,
          });
          el.cartApplicationId = el._id.toString();
          el.txnId = "";
          el.txnObjectId = transactionObjectId;
          el.serialNumber = serialNumber;
          el.appliedOnDate = currentDate;
          el.uniqueTransactionId = uniqueTransactionId;
          el.refundWalletAmountApplied = refundAmountToUpdate;
          el.rewardWalletAmountApplied = rewardAmountToUpdate;
          el.txnStatus = statusOfPayment;
          el.status = status.PENDING;
          el.totalPrice = 0;
          // el.srn = srnToUpdate;
          el["createdAt"] = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
          applicationDetails.push({
            applicationId: el._id,
            applicationType: serviceType.MSME,
            srn: el.srn,
          });
          applicationsSrn.push(el.srn);

          //-------------send refrence number to email Id-------------//

          let emailId =
            requestedType === Role.GUEST ? el.email : req.userData.userEmail;

          let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
            {
              applicationType: serviceType.MSME,
              name: el.propritorName.toUpperCase(),
              refNo: el.srn,
            },
            emailId
          );
          if (!sendEmailRefNo) {
            console.log("email not sent");
          }
        });

        transactionDataToBeAdded["applicationDetails"] = applicationDetails;
        transactionDataToBeAdded["cartItemsApplicationIds"] =
          cartApplicationsIds;

        const transactionCreated =
          await this.TransactionService.createTransaction(
            transactionDataToBeAdded
          );

        if (!transactionCreated || !transactionCreated.status) {
          this.addLogFunction.logAdd(
            req,
            requestedType,
            requestedId,
            "MSME_CART",
            "MSME_CART_ADD",
            "",
            true,
            200,
            `${requestedType} ${
              req.userData?.contactNumber || ""
            } added applications into cart at ${currentDate}.`,
            "Applications successfully added into cart.",
            req.socket.remoteAddress
          );
          throw new HttpException(
            "Unable to initiate transaction. Please try again.",
            HttpStatus.OK
          );
        }

        let deleteFailedApplication =
          await this.TransactionHelper.deleteFailedApplication(
            cartApplicationsIds,
            req
          );
        cartData = await this.MsmeModel.insertMany(cartItems);
        // delete applications from cart
        for (const item in cartData) {
          let { _id } = cartData[item];
          let deleteCartItems = await this.MsmeCartModel.findByIdAndDelete(_id);
        }
      }

      if (statusOfPayment !== paymentStatus.SUCCESS) {
        cartItems.forEach((el) => {
          let refundAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            refundAmountToBeInsert;
          let rewardAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            rewardAmountToBeInsert;
          // let srnToUpdate = generateSRN(serviceType.MSME);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.MSME,
          });
          el.cartApplicationId = el._id.toString();
          el._id = new mongoose.Types.ObjectId();
          el.txnId = "";
          el.txnObjectId = transactionObjectId;
          el.serialNumber = dataToBeInsert.serialNumber;
          el.uniqueTransactionId = dataToBeInsert.uniqueTransactionId;
          el.totalPrice = totalAmountForGateway;
          el.refundWalletAmountApplied = refundAmountToUpdate;
          el.rewardWalletAmountApplied = rewardAmountToUpdate;
          el.txnStatus = statusOfPayment;
          // el.srn = srnToUpdate;
          el.appliedOnDate = currentDate;
          el["createdAt"] = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
          applicationDetails.push({
            applicationId: el._id,
            applicationType: serviceType.MSME,
            srn: el.srn,
          });
          applicationsSrn.push(el.srn);
        });
        transactionDataToBeAdded["applicationDetails"] = applicationDetails;
        transactionDataToBeAdded["cartItemsApplicationIds"] =
          cartApplicationsIds;

        const transactionCreated =
          await this.TransactionService.createTransaction(
            transactionDataToBeAdded
          );

        if (!transactionCreated || !transactionCreated.status) {
          this.addLogFunction.logAdd(
            req,
            requestedType,
            requestedId,
            "MSME_CART",
            "MSME_CART_ADD",
            "",
            true,
            200,
            `${requestedType} ${
              req.userData?.contactNumber || ""
            } added applications into cart at ${currentDate}.`,
            "Applications successfully added into cart.",
            req.socket.remoteAddress
          );
          throw new HttpException(
            "Unable to initiate transaction. Please try again.",
            HttpStatus.OK
          );
        }

        cartData = await this.MsmeModel.insertMany(cartItems);

        if (!cartData.length) {
          throw new HttpException(
            "Unable to add msme application.",
            HttpStatus.OK
          );
        }

        for (const item of cartData) {
          const msmeAdd = await extractFieldsForMsmeFlowTable(item);
          const updatedPanFlow = await new this.MsmeApplicationFlowModel({
            msmeApplicationId: item._id,
            ...msmeAdd,
          }).save();
        }

        // delete applications from cart
        for (const item in cartData) {
          let { cartApplicationId } = cartData[item];
          let deleteCartItems = await this.MsmeCartModel.findByIdAndDelete(
            new mongoose.Types.ObjectId(cartApplicationId)
          );
        }
      }

      /**
       * call post application function to update refund , reward wallet,
       */
      let multipleSrnToUpdate = applicationsSrn.join(",");
      if (isRefundToBeUpdate === true) {
        const refundWalletUpdate =
          await this.postApplication.updateRefundWalletForCart(
            refundAmountToBeInsert,
            updateRefundWallet,
            req.userData.Id,
            serviceType.MSME,
            cartData[0]._id,
            req.userData.type,
            uniqueTransactionId,
            req,
            multipleSrnToUpdate
          );
      }

      if (
        // cartData[0].appliedAsType !== Role.GUEST &&
        // cartData[0].appliedAsType !== Role.GUEST &&
        isRewardToBeUpdate === true
      ) {
        const rewardWalletUpdate =
          await this.postApplication.updateRewardWalletForCart(
            rewardAmountToBeInsert,
            updateRewardWallet,
            req.userData.Id,
            serviceType.MSME,
            cartData[0]._id,
            multipleSrnToUpdate,
            uniqueTransactionId,
            req
          );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MSME_CART",
        "MSME_CART_ADD",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added applications at ${currentDate}.`,
        "Applications added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Application applied successfully.",
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
        "MSME_CART",
        "MSME_CART_CHECKOUT",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view cart  with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
