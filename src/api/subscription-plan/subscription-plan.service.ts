/* eslint-disable prefer-const */
import {
  subscription,
  subscriptionDocument,
} from "./entities/subscription-plan.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { errorRes } from "../../helper/errorRes";
import mongoose, { Model } from "mongoose";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import {
  SubscriptionFlow,
  SubscriptionFlowDocument,
  SubscriptionType,
} from "../subscription-flow/entities/subscription-flow.entity";
import { checkSubscriptionPlan } from "./subscription-plan.helper";
import {
  User,
  UserDocument,
  VerifyStatus,
  subscriptionPayment,
} from "../user/entities/user.entity";
import { status } from "../user-flow/entities/user-flow.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  Transaction,
  TransactionDocument,
  paymentStatus,
  transactionFor,
} from "../transaction/entities/transaction.entity";
import { paytmFunctions } from "../../helper/payment-gateway";

@Injectable()
export class SubscriptionServices {
  [x: string]: any;
  [x: number]: any;
  constructor(
    @InjectModel(subscription.name)
    private subscriptionModel: Model<subscriptionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(SubscriptionFlow.name)
    private subscriptionFlowModel: Model<SubscriptionFlowDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly checkSubscriptionPlan: checkSubscriptionPlan,
    private readonly generateId: getUniqueTransactionId,
    private readonly paytmFunctions: paytmFunctions
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create subscription
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const requestedId = req.subscriptionData?.Id || "";
      const requestedType = req.subscriptionData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const result = await new this.subscriptionModel(req.body).save();

      if (!result) {
        throw new HttpException("Unable to add subscription.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "SUBSCRIPTION",
        "SUBSCRIPTION_ADD",
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added SUBSCRIPTION at ${currentDate}.`,
        "SUBSCRIPTION added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Subscription added successfully.",
        status: true,
        data: result,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.subscriptionData?.type || "",
        req.subscriptionData?.Id || "",
        "SUBSCRIPTION",
        "SUBSCRIPTION_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.subscriptionData?.type || ""} ${
          req.subscriptionData?.Id || ""
        } tried to add SUBSCRIPTION with this credentials at ${moment()
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
   * update subscription
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, req: any, res) {
    try {
      const requestedId = req.subscriptionData?.Id || "";
      const requestedType = req.subscriptionData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      if (req.body.planName) {
        throw new HttpException("Could not update plan name.", HttpStatus.OK);
      }
      const subscriptionExist = await this.subscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isActive: true,
      });
      if (!subscriptionExist) {
        throw new HttpException("subscription not found.", HttpStatus.OK);
      }

      const logs = `${req.userData.type} ${req.userData.contactNumber} updated ${subscriptionExist.planName} subscription plan at ${currentDate}`;

      const result = await this.subscriptionModel.findByIdAndUpdate(
        { _id: subscriptionExist._id },
        {
          $set: { ...req.body },
          $push: { logs: logs },
        },
        { new: true }
      );

      if (!result) {
        throw new HttpException(
          "Could not update SUBSCRIPTION.",
          HttpStatus.OK
        );
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "SUBSCRIPTION",
        "SUBSCRIPTION_UPDATE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated SUBSCRIPTION ${id} at ${currentDate}.`,
        "SUBSCRIPTION updated successfully.",
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
        req.subscriptionData?.type || "",
        req.subscriptionData?.Id || "",
        "SUBSCRIPTION",
        "SUBSCRIPTION_UPDATE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.subscriptionData?.type || ""} ${
          req.subscriptionData?.Id || ""
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
   * find all subscriptions
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let query: any = {
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          isActive: true,
          isDeleted: false,
        };
      }

      const dataFound = await this.subscriptionModel.find({
        ...query,
      });
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "SUBSCRIPTION",
        "SUBSCRIPTION_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of SUBSCRIPTION at ${currentDate}.`,
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
        "SUBSCRIPTION",
        "SUBSCRIPTION_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of SUBSCRIPTION with this credentials at ${moment()
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
   * find one
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const dataFound = await this.subscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!dataFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "SUBSCRIPTION",
        "SUBSCRIPTION_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed SUBSCRIPTION ${id} at ${currentDate}.`,
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
        "SUBSCRIPTION",
        "SUBSCRIPTION_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view base price ${id} with this credentials at ${moment()
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
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.subscriptionData?.Id || "";
      const requestedType = req.subscriptionData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const subscriptionExist = await this.subscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!subscriptionExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = subscriptionExist.isActive === true ? false : true;
      const statusValue = activeStatus === true ? "ACTIVE" : "DEACTIVE";

      const statusChanged = await this.subscriptionModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isActive: activeStatus } },
        { new: true }
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "SUBSCRIPTION",
          "SUBSCRIPTION_STATUS",
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } change status of SUBSCRIPTION ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of SUBSCRIPTION ${id} successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Status changed to ${statusValue} successfully.`,
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
        req.subscriptionData?.type || "",
        req.subscriptionData?.Id || "",
        "SUBSCRIPTION",
        "SUBSCRIPTION_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.subscriptionData?.type || ""} ${
          req.subscriptionData?.Id || ""
        } tried to change status of SUBSCRIPTION ${id} with this credentials at ${moment()
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
   * subscription plan
   */
  //-------------------------------------------------------------------------

  async buySubscription(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const requestedName = req.userData?.userName || "";
      const { subscriptionId, deviceType } = req.body;
      const subscriptionPlan = await this.subscriptionModel.findOne({
        _id: new mongoose.Types.ObjectId(subscriptionId),
        isDeleted: false,
      });

      //generate payment transaction unique id

      const { uniqueTransactionId, serialNumber } =
        await this.generateId.generateId();
      let userDataToUpdate = {
        txnObjectId: new mongoose.Types.ObjectId(),
        uniqueTransactionId: uniqueTransactionId,
        serialNumber: serialNumber,
        deviceType: deviceType,
      };

      if (!subscriptionPlan) {
        throw new HttpException(`Invalid subcription plan.`, HttpStatus.OK);
      }

      //-------get user Details
      const userDetails = await this.userModel.findOne({
        _id: req.userData.Id,
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });

      if (!userDetails) {
        throw new HttpException(`Invalid user.`, HttpStatus.OK);
      }

      //check if user  status !pending then throw error
      // if (userDetails.status !== VerifyStatus.PENDING) {
      //   throw new HttpException(
      //     `Unable to buy subscription.....`,
      //     HttpStatus.OK,
      //   );
      // }

      //---------check user subscription type

      const requestedSubscriptionType = subscriptionPlan.planName;
      const amount = subscriptionPlan.amount;
      const expiryTime = subscriptionPlan.durationIndays;
      const userCreatedAt = userDetails["createdAt"];

      const checkUserSubscription =
        await this.checkSubscriptionPlan.checkSubscriptionPlan(
          requestedId,
          requestedSubscriptionType
        );
      if (checkUserSubscription.status === false) {
        throw new HttpException(checkUserSubscription.msg, HttpStatus.OK);
      }

      //-----calculate expiry date with subscription plan

      const userSubscriptionType = userDetails["subscriptionType"];
      // const expiryDate = await this.checkSubscriptionPlan.expiryDate(
      //   expiryTime,
      //   requestedId,
      //   userCreatedAt,
      //   userSubscriptionType,
      // );

      let redirectToPaymentGateway = amount > 0 ? true : false;
      let statusOfPayment =
        amount > 0 ? paymentStatus.PENDING : paymentStatus.SUCCESS;

      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      //create transaction and payment then add subscription plan to user profile.
      const transactionDataToBeAdded = {
        _id: userDataToUpdate.txnObjectId,
        txnId: "",
        serialNumber: userDataToUpdate.serialNumber,
        uniqueTransactionId: userDataToUpdate.uniqueTransactionId,
        sjbtCode: userDetails.sjbtCode,
        userId: userDetails._id.toString(),
        userType: userDetails.userType,
        applicationDetails: [],
        transactionFor: transactionFor.SUBSCRIPTION_PLAN,
        date: moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus: statusOfPayment,
        totalAmount: amount,
        remark: `Transaction initiated for ${req.userData.contactNumber} user's ${requestedSubscriptionType} subscription plan of amount ${subscriptionPlan.amount} `,
        reqData: [],
        resData: [],
      };

      //redirect to paymnet gateway

      if (redirectToPaymentGateway) {
        const paymentInitializeResponse: any =
          await this.paytmFunctions.initiatePayment({
            userId: req.userData.Id,
            totalAmount: amount,
            email: userDetails.email,
            uniqueTransactionId: userDataToUpdate.uniqueTransactionId,
            mobileNumber: userDetails.mobileNumber,
            deviceType,
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
        resDataToSend.paymentGatewayData["orderId"] =
          userDataToUpdate.uniqueTransactionId;
        resDataToSend.paymentGatewayData["token"] = null;
        resDataToSend.paymentGatewayData["amount"] = amount;
        resDataToSend.paymentGatewayData["tokenType"] = null;
      }

      let query = {
        subscriptionId: subscriptionId,
        subscriptionPlanExpiryDate: userDetails["subscriptionPlanExpiryDate"],
        subscriptionType: requestedSubscriptionType,
        subscriptionPayment: statusOfPayment,
        subscriptionTxnStatus: statusOfPayment,
      };

      if (requestedSubscriptionType === SubscriptionType.LIFETIME) {
        query = {
          subscriptionId: subscriptionId,
          subscriptionPlanExpiryDate: "",
          subscriptionType: requestedSubscriptionType,
          subscriptionPayment: statusOfPayment,
          subscriptionTxnStatus: statusOfPayment,
        };
      }

      const updateUserData = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(requestedId), isDeleted: false },
        {
          $set: { ...query, ...userDataToUpdate },
        },
        { new: true }
      );

      if (!updateUserData) {
        throw new HttpException(`Unable to buy subscription.`, HttpStatus.OK);
      }

      const subscriptionFlowData = {
        userId: requestedId,
        uniqueTransactionId: transactionDataToBeAdded.uniqueTransactionId,
        amount: amount,
        subscriptionType: requestedSubscriptionType,
        subscriptionExpiry: updateUserData.subscriptionPlanExpiryDate,
      };

      //------update subscription flow dat
      const updateSubscriptionFlow = await this.subscriptionFlowModel.create(
        subscriptionFlowData
      );

      if (!updateSubscriptionFlow) {
        throw new HttpException(`Unable to buy subscription.`, HttpStatus.OK);
      }

      //--------create transaction
      const createTransaction = await new this.transactionModel({
        ...transactionDataToBeAdded,
      }).save();

      //-----update userData

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        `SUBSCRIPTION_PLAN`,
        `SUBSCRIPTION_PLAN_ADD`,
        req.body.applicationId,
        true,
        200,
        `${requestedType} ${requestedName} created subscription plan at ${currentDate}.`,
        `Subscription plan successfully created.`,
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: `Congratulations! You have successfully purchased the ${requestedSubscriptionType} subscription Plan.`,
        status: true,
        data: resDataToSend,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        `SUBSCRIPTION_PLAN`,
        `SUBSCRIPTION_PLAN_ADD`,
        req.body.applicationId,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to add subscription plan ${
          req.body.applicationId
        } with this credentials at ${moment()
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
   * all with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------
  async findSubscriptionHistory(res, req) {
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
        "userId",
        "userName",
        "email",
        "mobileNumber",
        "uniqueTransactionId",
        "amount",
        "subscriptionType",
        "subscriptionExpiry",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      const matchQuery: { $and: any[] } = {
        $and: [{ userId: req.userData.Id }, { isDeleted: false }],
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
      const additionaQuery = [
        {
          $addFields: {
            user_id: { $toObjectId: "$userId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
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
          $addFields: {
            userName: { $arrayElemAt: ["$user.name", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            mobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
            subscriptionTxnStatus: {
              $arrayElemAt: ["$transactions.paymentStatus", 0],
            },
            subscriptionExpiry: {
              $cond: {
                if: {
                  $eq: [
                    { $arrayElemAt: ["$transactions.paymentStatus", 0] },
                    "SUCCESS",
                  ],
                },
                then: { $arrayElemAt: ["$user.subscriptionPlanExpiryDate", 0] },
                else: "",
              },
            },
          },
        },
        {
          $unset: ["user", "user_id", "transactions"],
        },
      ];

      // const additionaQuery = [];

      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.subscriptionFlowModel.aggregate(countQuery);

      if (dataFound.length === 0) {
        throw new HttpException(`No data found.`, HttpStatus.OK);
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

      const result = await this.subscriptionFlowModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "SUBSCRIPTION_FLOW",
          "SUBSCRIPTIN_FLOW_FILTER",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data of subscription history at ${currentDate}.`,
          "Subscription history Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Subscription history Found successfully",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No data found.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "SUBSCRIPTION_FLOW",
        "SUBSCRIPTIN_FLOW_FILTER",
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
}
