/* eslint-disable prefer-const */
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  RejectionList,
  RejectionListDocument,
} from "../rejection-list/entities/rejection-list.entity";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import { generateSRN } from "../../helper/otpGenerate.helper";
import { User, UserDocument, VerifyStatus } from "../user/entities/user.entity";
import { Role } from "../user-flow/entities/user-flow.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import { ItrCartHelper } from "./itr-cart.helper";
import { ItrCart, ItrCartDocument, status } from "./entities/itr-cart.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  paymentStatus,
  transactionFor,
} from "../transaction/entities/transaction.entity";
import { TransactionService } from "../transaction/transaction.service";
import { paytmFunctions } from "../../helper/payment-gateway";
import { postApplication } from "../../helper/postApplication";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import { ItrApplicationFlow } from "../itr-application-flow/entities/itr-application-flow.entity";
import { extractFieldsForItrFlowTable } from "../../helper/createNewEntryOfAppInFlow";
import { EmailService } from "../../helper/sendEmail";
import { TransactionHelper } from "../transaction/transaction.helper";

@Injectable()
export class ItrCartServices {
  [x: string]: any;
  constructor(
    @InjectModel(ItrCart.name) private ItrCartModel: Model<ItrCartDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly ItrCartHelper: ItrCartHelper,
    @InjectModel(RejectionList.name)
    private readonly RejectionModel: Model<RejectionListDocument>,
    @InjectModel(ItrApplication.name)
    private readonly ItrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(ItrApplicationFlow.name)
    private readonly ItrApplicationFlowModel: Model<ItrApplicationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly paytmFunctions: paytmFunctions,
    private readonly TransactionService: TransactionService,
    private readonly TransactionHelper: TransactionHelper,
    private readonly postApplication: postApplication,
    private readonly EmailService: EmailService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
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
        !appliedByTypeUserExist.services?.includes(serviceType.ITR)
      ) {
        throw new HttpException(
          `You are not allow to access this ITR service.`,
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
          req.body.retailerMobileNumber = retailerExist.mobileNumber;
        }
      }

      const ItrCartHelper = await this.ItrCartHelper.ItrCartItems(
        req.body.itrCartItems,
        req,
        res
      );

      ItrCartHelper.forEach((el) => {
        el.srn = generateSRN(serviceType.ITR);
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
        el.status = status.BLANK;
      });

      //get toal price
      for (const each in ItrCartHelper) {
        const { appliedByType, paymentCategory, appliedAsType } =
          ItrCartHelper[each];

        const priceConfigs = await this.ItrCartHelper.getAmount(
          appliedAsType,
          paymentCategory
        );
        if (!priceConfigs || priceConfigs === undefined) {
          throw new HttpException(
            "Unable to calculate total Price.",
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
          additionalCat2,
          additionalCat3,
          basePrice,
          baseCatAppied,
        } = priceConfigs.data;
        ItrCartHelper[each]["additionalCat2"] = additionalCat2;
        ItrCartHelper[each]["additionalCat3"] = additionalCat3;
        ItrCartHelper[each]["totalPrice"] = totalAmount;
        ItrCartHelper[each]["applicationIndividualPrice"] = totalAmount;
        ItrCartHelper[each]["convinienceCharges"] = convinienceCharges;
        ItrCartHelper[each]["basePrice"] = basePrice;
        ItrCartHelper[each]["baseCatAppied"] = baseCatAppied;
      }

      const cartData = await this.ItrCartModel.insertMany(ItrCartHelper);

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ITR_CART",
        "ITR_CART_ADD",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added applications into cart at ${currentDate}.`,
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
        "ITR_CART",
        "ITR_CART_ADD",
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to add to cart ITR  with this ${req.userData.mobileNumber}.`,
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
  //------------------------------------------------------P-------------------

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

      const cartItems = await this.ItrCartModel.find({
        appliedById: req.userData.Id,
        isDeleted: false,
      });

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();

      const dataToBeInsert = {
        uniqueTransactionId: uniqueTransactionId,
        serialNumber: serialNumber,
        srn: generateSRN(serviceType.ITR),
        ...cartItems,
      };

      let totalAmountForGateway = 0;
      let refundAmountToBeInsert = 0;
      let rewardAmountToBeInsert = 0;

      totalAmountForGateway = cartItems.reduce((acc, cartItem) => {
        return acc + cartItem.totalPrice;
      }, 0);

      let updateRefundWallet = 0;
      let updateRewardWallet = 0;
      let isRefundToBeUpdate = false;
      let isRewardToBeUpdate = false;
      let walletUsed = 0;

      //applied refund wallet and get remaining amount

      if (isRefundApplied) {
        let isRefundExist = await this.ItrCartHelper.getRefundAmount(
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
        let isRewardExist = await this.ItrCartHelper.getRewardAmount(
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
        cartApplicationsIds: cartApplicationsIds,
        transactionFor: transactionFor.SERVICE_PAYMENT,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: totalAmountForGateway,
        remark: `Transaction created for ITR application on ${moment()
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
          // let srnToUpdate = generateSRN(serviceType.ITR);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.ITR,
          });
          el.txnId = "";
          el.txnObjectId = transactionObjectId;
          el.serialNumber = serialNumber;
          el.appliedOnDate = currentDate;
          el.uniqueTransactionId = uniqueTransactionId;
          el.cartApplicationId = el._id.toString();
          el.refundWalletAmountApplied = refundAmountToUpdate;
          el.rewardWalletAmountApplied = rewardAmountToUpdate;
          el.txnStatus = statusOfPayment;
          el.status = status.PENDING;
          el.totalPrice = 0;
          // el.srn = srnToUpdate;
          el["createdAt"] = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
          applicationDetails.push({
            applicationId: el._id,
            applicationType: serviceType.ITR,
            srn: el.srn,
          });
          applicationsSrn.push(el.srn);

          //-------------send refrence number to email Id-------------//

          let emailId =
            requestedType === Role.GUEST ? el.emailId : req.userData.userEmail;

          let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
            {
              applicationType: serviceType.ITR,
              name: el.firstName.toUpperCase(),
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
            "ITR_CART",
            "ITR_CART_CHECKOUT",
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
        cartData = await this.ItrApplicationModel.insertMany(cartItems);

        // delete applications from cart
        for (const item in cartData) {
          let { _id } = cartData[item];
          let deleteCartItems = await this.ItrCartModel.findByIdAndDelete(_id);
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
          // let srnToUpdate = generateSRN(serviceType.ITR);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.ITR,
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
            applicationType: serviceType.ITR,
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
            "ITR_CART",
            "ITR_CART_CHECKOUT",
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

        cartData = await this.ItrApplicationModel.insertMany(cartItems);

        if (!cartData.length) {
          throw new HttpException(
            "Unable to add itr application.",
            HttpStatus.OK
          );
        }

        for (const item of cartData) {
          const itradd = await extractFieldsForItrFlowTable(item);
          const updatedPanFlow = await new this.ItrApplicationFlowModel({
            itrApplicationId: item._id,
            ...itradd,
          }).save();
        }
        // delete applications from cart
        for (const item in cartData) {
          let { cartApplicationId } = cartData[item];
          let deleteCartItems = await this.ItrCartModel.findByIdAndDelete(
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
            serviceType.ITR,
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
            serviceType.ITR,
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
        "ITR_CART",
        "ITR_CART_CHECKOUT",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added applications into cart at ${currentDate}.`,
        "Applications successfully added into cart.",
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
        "ITR_CART",
        "ITR_CART_CHECKOUT",
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

      const itrCartItemsFound = await this.ItrCartModel.find(query);

      if (!itrCartItemsFound.length) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ITR_CART",
        "ITR_CART_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        }viewed itr cart  ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: itrCartItemsFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "ITR_CART",
        "ITR_CART_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view itr cart ${id} with this credentials at ${moment()
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
      const cartFound = await this.ItrCartModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!cartFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.ItrCartModel.findByIdAndUpdate(
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
        "ITR_CART",
        "ITR_CART_DELETE",
        id,
        true,
        200,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } updated cart ${id} at ${currentDate}.`,
        "Itr cart deleted successfully.",
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
        "ITR_CART",
        "ITR_CART_DELETE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${id} tried to delete Itr cart with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
