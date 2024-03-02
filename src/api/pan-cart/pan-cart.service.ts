/* eslint-disable prefer-const */
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  applicationTypes,
  formCategory,
  PanCart,
  PanCartDocument,
  status,
} from "./entities/pan-cart.entity";
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
import { PanHelper } from "../panapplications/pan.helper";
import { Role } from "../user-flow/entities/user-flow.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import { adminHelper } from "../admin/admin.helper";
import { postApplication } from "../../helper/postApplication";
import { userAuthHelper } from "../../auth/auth.helper";
import { panCartHelper } from "./pan-cart.helper";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  paymentStatus,
  transactionFor,
} from "../transaction/entities/transaction.entity";
import {
  PanApplication,
  PanDocument,
  paymentCategories,
} from "../panapplications/entities/pan.entity";
import { TransactionService } from "../transaction/transaction.service";
import { paytmFunctions } from "../../helper/payment-gateway";
import {
  PanApplicationFlow,
  PanApplicationFlowDocument,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  MsmeCart,
  MsmeCartDocument,
} from "../msme-cart/entities/msme-cart.entity";
import {
  GumastaCart,
  GumastaCartDocument,
} from "../gumasta-cart/entities/gumasta-cart.entity";
import { ItrCart, ItrCartDocument } from "../itr-cart/entities/itr-cart.entity";
import { DscCart, DscCartDocument } from "../dsc-cart/entities/dsc-cart.entity";
import { EmailService } from "../../helper/sendEmail";
import { TransactionHelper } from "../transaction/transaction.helper";
import { sendMsg91Function } from "src/helper/smsSend.helper";
import { Client } from "../../helper/initRedis";

@Injectable()
export class PanCartServices {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name) private AdminModel: Model<adminDocument>,
    @InjectModel(PanApplication.name)
    private panApplicationModel: Model<PanDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly panCartHelper: panCartHelper,
    private readonly adminHelper: adminHelper,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly PanHelper: PanHelper,
    @InjectModel(RejectionList.name)
    private readonly RejectionModel: Model<RejectionListDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PanApplicationFlow.name)
    private readonly PanAppFlowModel: Model<PanApplicationFlowDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    @InjectModel(PanCart.name)
    private PanCartModel: Model<PanCartDocument>,
    @InjectModel(MsmeCart.name)
    private readonly MsmeCartModel: Model<MsmeCartDocument>,
    @InjectModel(ItrCart.name)
    private readonly ItrCartModel: Model<ItrCartDocument>,
    @InjectModel(GumastaCart.name)
    private readonly GumastaCartModel: Model<GumastaCartDocument>,
    @InjectModel(DscCart.name)
    private readonly DscCartModel: Model<DscCartDocument>,
    private readonly postApplication: postApplication,
    private readonly userAuthHelper: userAuthHelper,
    private readonly paytmFunctions: paytmFunctions,
    private readonly TransactionService: TransactionService,
    private readonly TransactionHelper: TransactionHelper,
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
        !appliedByTypeUserExist.services?.includes(serviceType.PAN)
      ) {
        throw new HttpException(
          `You are not allow to access this PAN service.`,
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

      // if (req.userData.type !== Role.GUEST && !distributorExist) {
      //   let userId = req.userData.Id;
      //   const tokenKey = `${userId}*`;
      //   Client.KEYS(tokenKey, async (err: any, keys: any) => {
      //     if (err) {
      //       console.log("Some error occurred", err);
      //     }

      //     if (!keys || keys.length === 0) {
      //       console.log("No keys found.");
      //     }

      //     const deletePromises = keys.map((key: any) => Client.DEL(key));
      //     await Promise.all(deletePromises);
      //   });
      // }

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

      const panCartItems = await this.panCartHelper.panCartValidations(
        req.body.panCartItems,
        req,
        res
      );
      panCartItems.forEach((el) => {
        el.srn = generateSRN(serviceType.PAN);
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
      for (const each in panCartItems) {
        const { appliedByType, paymentCategory, appliedAsType } =
          panCartItems[each];

        const priceConfigs = await this.panCartHelper.getAmount(
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
          basePrice,
          mainCategoryPrice,
          additionalCat2,
          additionalCat3,
          baseCatAppied,
        } = priceConfigs.data;

        if (baseCatAppied == paymentCategories.CAT_DSA) {
          let user = await this.panCartHelper.getAppliedUser(req.userData.Id);

          if (user !== null && user.pincode == "") {
            throw new HttpException(
              "Please update your profile address to apply for category DSA.",
              HttpStatus.OK
            );
          }
        }

        //get total amount for all application

        panCartItems[each]["mainCategoryPrice"] = mainCategoryPrice;
        panCartItems[each]["additionalCat2"] = additionalCat2;
        panCartItems[each]["additionalCat3"] = additionalCat3;
        panCartItems[each]["totalPrice"] = totalAmount;
        panCartItems[each]["convinienceCharges"] = convinienceCharges;
        panCartItems[each]["basePrice"] = basePrice;
        panCartItems[each]["applicationIndividualPrice"] = totalAmount;
        panCartItems[each]["baseCatAppied"] = baseCatAppied;
      }

      const cartData = await this.PanCartModel.insertMany(panCartItems);

      cartData.forEach(async (el) => {
        const panadd = await extractFieldsForPanFlowTable(el);
        const updatedPanFlow = await new this.PanAppFlowModel({
          panApplicationId: el._id,
          ...panadd,
        }).save();
      });

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_CART",
        "PAN_CART_ADD",
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
        "PAN_CART",
        "PAN_CART_ADD",
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to add to cart PAN  with this ${req.userData.mobileNumber}.`,
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

      const cartItems = await this.PanCartModel.find({
        appliedById: req.userData.Id,
        isDeleted: false,
      });

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();

      const dataToBeInsert = {
        uniqueTransactionId: uniqueTransactionId,
        serialNumber: serialNumber,
        // srn: generateSRN(serviceType.PAN),
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
        let isRefundExist = await this.panCartHelper.getRefundAmount(
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
        let isRewardExist = await this.panCartHelper.getRewardAmount(
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
        remark: `Transaction created for PAN application on ${moment()
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
          // let srnToUpdate = generateSRN(serviceType.PAN);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.PAN,
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
          el["createdAt"] = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
          // el.srn = srnToUpdate;
          applicationDetails.push({
            applicationId: el._id,
            applicationType: serviceType.PAN,
            srn: el.srn,
          });
          applicationsSrn.push(el.srn);
          //-------------send refrence number to phone number-------------//
          let msg91Data = {
            template_id: process.env.MSG91_PAN_REGISTRATION_TEMPLATE_ID,
            sender: process.env.MSG91_SENDER_ID,
            short_url: "0",
            mobiles: "+91" + appliedByTypeUserExist.mobileNumber,
            name: el.name.toUpperCase(),
            refno: el.srn,
          };

          const msgSent: any = await sendMsg91Function(msg91Data);
          if (!msgSent || !msgSent.sendStatus) {
            console.log(msgSent.sendStatus);
          }

          //-------------send refrence number to email Id-------------//

          let emailId =
            requestedType === Role.GUEST ? el.email : req.userData.userEmail;

          let sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
            {
              applicationType: serviceType.PAN,
              name: el.name.toUpperCase(),
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
            "PAN_CART",
            "PAN_CART_CHECKOUT",
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
        cartData = await this.panApplicationModel.insertMany(cartItems);

        // delete applications from cart
        for (const item in cartData) {
          let { _id } = cartData[item];
          let deleteCartItems = await this.PanCartModel.findByIdAndDelete(_id);
        }
      }
      if (statusOfPayment !== paymentStatus.SUCCESS) {
        cartItems.forEach(async (el) => {
          let refundAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            refundAmountToBeInsert;
          let rewardAmountToUpdate =
            (el.applicationIndividualPrice / totalAmountOfCart) *
            rewardAmountToBeInsert;
          // let srnToUpdate = generateSRN(serviceType.PAN);
          cartApplicationsIds.push({
            cartAppliationId: el._id.toString(),
            applicationType: serviceType.PAN,
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
            applicationType: serviceType.PAN,
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
            "PAN_CART",
            "PAN_CART_CHECKOUT",
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

        cartData = await this.panApplicationModel.insertMany(cartItems);

        if (!cartData.length) {
          throw new HttpException(
            "Unable to add pan application.",
            HttpStatus.OK
          );
        }

        for (const item of cartData) {
          const panadd = await extractFieldsForPanFlowTable(item);
          const updatedPanFlow = await new this.PanAppFlowModel({
            panApplicationId: item._id,
            ...panadd,
          }).save();
        }

        // delete applications from cart
        for (const item in cartData) {
          let { cartApplicationId } = cartData[item];
          let deleteCartItems = await this.PanCartModel.findByIdAndDelete(
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
            serviceType.PAN,
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
            serviceType.PAN,
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
        "PAN_CART",
        "PAN_CART_ADD",
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
        "PAN_CART",
        "PAN_CART_CHECKOUT",
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

      const panCartItemsFound = await this.PanCartModel.find(query);

      if (!panCartItemsFound.length) {
        throw new HttpException("Application not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_CART",
        "PAN_CART_VIEW",
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
        data: panCartItemsFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_CART",
        "PAN_CART_VIEW",
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
   * delete cart
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const cartFound = await this.PanCartModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!cartFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.PanCartModel.findByIdAndUpdate(
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
        "PAN_CART",
        "PAN_CART_DELETE",
        id,
        true,
        200,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } updated cart ${id} at ${currentDate}.`,
        "Pan cart deleted successfully.",
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
        "PAN_CART",
        "PAN_CART_DELETE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${id}  tried to delete Pan cart with this credentials at ${moment()
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
   * cart count of login user
   */
  //-------------------------------------------------------------------------

  async cartCount(id: string, res, req) {
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

      const panCartItemsFound = await this.PanCartModel.find(query).count();
      const dscCartItemsFound = await this.DscCartModel.find(query).count();
      const itrCartItemsFound = await this.ItrCartModel.find(query).count();
      const gumastaCartItemsFound = await this.GumastaCartModel.find(
        query
      ).count();
      const msmeItemsFound = await this.MsmeCartModel.find(query).count();
      let totalCartItems =
        panCartItemsFound +
        dscCartItemsFound +
        itrCartItemsFound +
        gumastaCartItemsFound +
        msmeItemsFound;

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "PAN_CART",
        "PAN_CART_COUNT",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        }viewed cart count  ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: { totalItems: totalCartItems },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "PAN_CART",
        "PAN_CART_COUNT",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view cart count ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
