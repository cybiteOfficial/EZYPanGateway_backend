import { Injectable } from "@nestjs/common";
import {
  Transaction,
  TransactionDocument,
  paymentStatus,
  paytmStatus,
  transactionFor,
} from "./entities/transaction.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PaytmChecksum } from "../../helper/paytmChecksum";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import { HttpException, HttpStatus } from "@nestjs/common";
import * as https from "https";
import {
  subscriptionPayment,
  User,
  UserDocument,
} from "../user/entities/user.entity";
import { TransactionHelper } from "./transaction.helper";
import { paytmFunctions } from "../../helper/payment-gateway";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
  transactionType,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import {
  DigitalPanApplication,
  DigitalPanDocument,
} from "../../api/digital-pan/entities/digital-pan.entity";
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import { status } from "../digital-sign/entities/digital-sign.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { serviceType } from "../price-config/entities/price-config.entity";
import { EmailService } from "../../helper/sendEmail";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class TransactionService {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanApplication.name)
    private readonly DigitalPanApplicationModel: Model<DigitalPanDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(DigitalPanWallet.name)
    private readonly DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private readonly DigitalPanTransactionsModel: Model<DigitalPanTransactionsDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly TransactionHelper: TransactionHelper,
    private readonly paytmFunctions: paytmFunctions,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly EmailService: EmailService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * view transaction
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
        userId: req.userData.Id,
        isDeleted: false,
      };

      const transactionsFound = await this.transactionModel.find(query);

      if (!transactionsFound.length) {
        throw new HttpException("Transactions not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "TRANSACTIONS",
        "TRANSACTIONS_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        }viewed transactions  ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: transactionsFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DSC_CART",
        "DSC_CART_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${id} tried to view DSC cart ${id} with this credentials at ${moment()
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
  async allWithFilters(res, req) {
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
        "_id",
        "sjbtCode",
        "userId",
        "userType",
        "applicationId",
        "applicationType",
        "transactionFor",
        "srn",
        "date",
        "txnId",
        "uniqueTransactionId",
        "paymentStatus",
        "totalAmount",
        "remark",
        "serialNumber",
        "uniqueTransactionId",
        "reqData",
        "resData",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const matchQuery: { $and: any[] } = {
        $and: [{}],
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
      const booleanFields = ["isActive", "isDeleted"];
      const numberFileds = ["serialNumber", "totalAmount"];

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
      const additionaQuery = [{ $unset: ["__v", "password"] }];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.transactionModel.aggregate(countQuery);
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
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "TRANSACTIONS"
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

      const result = await this.transactionModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "TRANSACTION",
          "TRANSACTION_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data to view transactions at ${currentDate}.`,
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
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * create transaction
   */
  //-------------------------------------------------------------------------

  async createTransaction(transactionDataToBeAdded) {
    try {
      const newPanApplied = await new this.transactionModel({
        ...transactionDataToBeAdded,
      }).save();

      if (newPanApplied) {
        return {
          status: true,
          message: "Transaction Added Successfully.",
          data: newPanApplied,
        };
      } else {
        return {
          status: false,
          message: "Something went wrong.",
          data: null,
        };
      }
    } catch (err) {
      let i = 1;
      let error_msg = "";
      const statusCode =
        err.status !== undefined && err.status !== null ? err.status : 500;
      if (!err.message) {
        for (const key in err.errors) {
          if (err.errors[key].message) {
            error_msg += i + "." + err.errors[key].message;
            i++;
          }
        }
      } else {
        error_msg = err.message;
      }
      return {
        status: false,
        message: error_msg,
        data: null,
      };
    }
  }

  //-------------------------------------------------------------------------
  /***
   * verify signature
   */
  //-------------------------------------------------------------------------

  async verifyPayment(req: any, res: any) {
    try {
      for (const key in req.body) {
        req.body[key] = req.body[key] && req.body[key].trim();
      }
      const currentDate = moment().utcOffset("+05:30").format("YYYY-MM-DD ");
      const { ORDERID: orderId, TXNID: txnId } = req.body;

      const txnData = await this.transactionModel.findOne({
        uniqueTransactionId: orderId,
      });

      if (!txnData) {
        throw new HttpException("Transaction not found", HttpStatus.OK);
      }

      /**
       *
       * verify payment function to check transaction status
       *
       */
      const isPaymentVerified: any = await this.paytmFunctions.verifyPayment(
        req.body,
        txnData
      );

      if (!isPaymentVerified.status) {
        throw new HttpException(isPaymentVerified.message, HttpStatus.OK);
      }

      /**
       *
       * txnDataToBeUpdated :to update transaction status and transaction Id received from pament gateway
       *
       */
      const txnDataToBeUpdated = {
        $set: { paymentStatus: isPaymentVerified.paymentStatus, txnId: txnId },
        $push: { resData: { ...req.body } },
      };

      /**
       *
       * appOrUserDataToBeUpdate :to update transaction status and transaction Id received from payment gateway into
       * application or user in case of subscription
       *
       */

      let appOrUserDataToBeUpdate;

      if (txnData.transactionFor === transactionFor.SERVICE_PAYMENT) {
        appOrUserDataToBeUpdate = {
          $set: { txnStatus: isPaymentVerified.paymentStatus, txnId: txnId },
        };
      }

      if (txnData.transactionFor === transactionFor.SUBSCRIPTION_PLAN) {
        appOrUserDataToBeUpdate = {
          $set: {
            subscriptionTxnStatus: isPaymentVerified.paymentStatus,
            txnId: txnId,
            subscriptionTxnDate: currentDate,
            subscriptionPayment:
              isPaymentVerified.paymentStatus === paymentStatus.SUCCESS
                ? subscriptionPayment.SUCCESS
                : subscriptionPayment.PENDING,
          },
        };
      }

      /**
       * update digital pan wallet in case of recharge wallet payment declined and failure
       */

      if (
        isPaymentVerified.paymentStatus === paymentStatus.SUCCESS &&
        txnData.transactionFor === transactionFor.DIGITAL_PAN_WALLET_RECHARGE
      ) {
        const updateDigitalPanWallet =
          await this.TransactionHelper.updateDigitalPanWallet(
            req,
            orderId,
            isPaymentVerified.paymentStatus
          );

        if (!updateDigitalPanWallet.status) {
          console.log(updateDigitalPanWallet.msg);
        }
      }

      if (
        isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
        txnData.transactionFor === transactionFor.DIGITAL_PAN_WALLET_RECHARGE
      ) {
        const updateDigitalPanWallet =
          await this.TransactionHelper.createDigitalPanWalletHistory(
            req,
            orderId,
            isPaymentVerified.paymentStatus
          );

        if (!updateDigitalPanWallet.status) {
          console.log(updateDigitalPanWallet.msg);
        }
      }

      const transactionUpdate = await this.TransactionHelper.updateTxnStatus(
        "NO",
        isPaymentVerified.paymentStatus,
        orderId,
        txnDataToBeUpdated,
        appOrUserDataToBeUpdate,
        req,
        res
      );

      if (!transactionUpdate.status) {
        console.log(transactionUpdate.msg);
      }

      let redirectUrl;
      if (isPaymentVerified.paymentStatus == paymentStatus.SUCCESS) {
        /**send refrence number through sms for success pan application */

        if (txnData.transactionFor === transactionFor.SERVICE_PAYMENT) {
          for (const applicationDetails of txnData.applicationDetails) {
            let { applicationType, applicationId, srn } = applicationDetails;

            let applicationFound =
              await this.TransactionHelper.checkApplication(
                applicationId,
                applicationType
              );
            if (!applicationFound) {
              console.log("application not found");
            }

            if (applicationType === "PAN") {
              /**send refrence number to phone number */
              await this.TransactionHelper.sendSmsRefno(
                applicationFound,
                applicationFound.mobileNumber,
                applicationFound.name,
                applicationFound.srn
              );
            }

            /**send refrence number to email  */
            await this.TransactionHelper.sendEmailRefno(
              applicationType,
              applicationFound
            );
          }
        }
        redirectUrl = process.env.TXN_SUCCESS_REDIRECT_URL;
      }
      if (isPaymentVerified.paymentStatus == paymentStatus.PENDING) {
        redirectUrl = process.env.TXN_PENDING_REDIRECT_URL;
      }
      if (isPaymentVerified.paymentStatus == paymentStatus.FAILURE) {
        redirectUrl = process.env.TXN_FAILURE_REDIRECT_URL;
      }

      res.redirect(`${redirectUrl}?txn=${orderId}`);

      // if (!transactionUpdate.status) {
      //   throw new HttpException(transactionUpdate.message, HttpStatus.OK);
      // }

      /**find application */
      let applicationFound;
      let refundAmount;
      let rewardAmount;
      for (const applicationDetails of txnData.applicationDetails) {
        const { applicationType, applicationId, srn } = applicationDetails;

        applicationFound = await this.TransactionHelper.checkApplication(
          applicationId,
          applicationType
        );

        if (!applicationFound) {
          throw new HttpException("Application not found.", HttpStatus.OK);
        }
        let { refundWalletAmountApplied, rewardWalletAmountApplied } =
          applicationFound;
        refundAmount = refundWalletAmountApplied;
        rewardAmount = rewardWalletAmountApplied;

        /**
         * update refund and reward wallet in case of payment declined and failure
         */
        if (
          isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
          txnData.transactionFor === transactionFor.SERVICE_PAYMENT
        ) {
          //update reward wallet and reward transaction history
          if (rewardAmount > 0) {
            const updateRewardData =
              await this.TransactionHelper.updateRewardWallet(req, orderId);
            if (!updateRewardData.status) {
              console.log(updateRewardData.msg);
            }
          }

          //update refund wallet and refund transaction history
          if (refundAmount > 0) {
            const updateRefundData =
              await this.TransactionHelper.updateRefundWallet(req, orderId);

            if (!updateRefundData.status) {
              console.log(updateRefundData.msg);
            }
          }

          //update  refund and reward amount applied in application
          if (refundAmount > 0 || rewardAmount > 0) {
            const updateApplicationAmt =
              await this.TransactionHelper.updateApplicationAmt(orderId);
            if (!updateApplicationAmt.status) {
              console.log(updateApplicationAmt.msg);
            }
          }
        }
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "TRANSACTION",
        "PAYMENT_VERIFY",
        req.body.orderId,
        errData.resData.status,
        errData.statusCode,
        `Transaction verification failed against orderId ${
          req.body.orderId
        } ${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   crete webhook api religare
   */
  //-------------------------------------------------------------------------

  async DigitalPanResponse(req: any, res: any) {
    try {
      const { statusCode, message, transactions, agentID, txnId } = req.body;

      if (!statusCode || !message || !transactions || !agentID || !txnId) {
        return res.status(400).json({ message: "Missing or invalid fields" });
      }
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(agentID),
      });

      if (!userFound) {
        throw new HttpException(`User ${agentID} not found.`, HttpStatus.OK);
      }
      let { userType } = userFound;

      let updateDigitalPanApplication =
        await this.DigitalPanApplicationModel.findOneAndUpdate(
          {
            txnId: txnId,
            agentID: agentID,
          },
          {
            $set: {
              totalPrice: transactions.Amount,
              Type: transactions.Type,
              mobileNumber: transactions.Number,
              status: transactions.Status,
              appliedByType: userType,
              appliedById: agentID,
              appliedOnDate: currentDate,
              Transactions: transactions,
            },
          }
        );

      if (!updateDigitalPanApplication) {
        throw new HttpException(
          `Something went wrong. Could't create transactions.`,
          HttpStatus.OK
        );
      }
      const digitalPanWallet = await this.DigitalPanWalletModel.findOne({
        userId: agentID,
      });
      if (!digitalPanWallet) {
        throw new HttpException(
          `Wallet not found. Could't create transactions.`,
          HttpStatus.OK
        );
      }
      let { walletAmount, freezeAmount } = digitalPanWallet;
      let resDataToSend = {
        statusCode: statusCode,
        message: message,
        transactions: updateDigitalPanApplication.Transactions,
        agentID: updateDigitalPanApplication.agentID,
        txnId: updateDigitalPanApplication.txnId,
      };

      if (statusCode == 1) {
        //duduct locked amount from wallet

        const remainingAmount = walletAmount - transactions.Amount;

        const digitalPanWalletToBeUpdate =
          await this.DigitalPanWalletModel.findOneAndUpdate(
            { userId: agentID },
            {
              $set: {
                walletAmount: remainingAmount,
                freezeAmount: freezeAmount - transactions.Amount,
                lock: false,
              },
            },
            {
              new: true,
            }
          );

        if (!digitalPanWalletToBeUpdate) {
          throw new HttpException(
            `Something went wrong. Could't create transactions.`,
            HttpStatus.OK
          );
        }

        const paymentStatusToUpdate = transactions.Status.toUpperCase();

        //create digital Pan wallet history
        const DigitalwalletTransactionToBeCreate = {
          walletId: digitalPanWallet._id,
          userId: agentID,
          uniqueTransactionId: "",
          remark: `Wallet amount deducted  ${transactions.Amount}  for Digital Pan application.`,
          serialNumber: "",
          transactionType: transactionType.DEBIT,
          txnId: txnId,
          paymentStatus: paymentStatusToUpdate,
          debitedAmount: transactions.Amount,
          createdByType: "",
          createdById: "",
          dateAndTime: currentDate,
        };

        const digitalPanWalletHistory =
          await this.DigitalPanTransactionsModel.create({
            ...DigitalwalletTransactionToBeCreate,
          });

        resDataToSend = {
          statusCode: statusCode,
          message: message,
          transactions: transactions,
          agentID: agentID,
          txnId: txnId,
        };
      }
      if (statusCode == 0) {
        const digitalPanWalletToBeUpdate =
          await this.DigitalPanWalletModel.findOneAndUpdate(
            { userId: agentID },
            {
              $set: {
                freezeAmount: freezeAmount - transactions.Amount,
                lock: false,
              },
            },
            {
              new: true,
            }
          );

        if (!digitalPanWalletToBeUpdate) {
          throw new HttpException(
            `Something went wrong. Could't create transactions.`,
            HttpStatus.OK
          );
        }

        resDataToSend = {
          statusCode: statusCode,
          message: message,
          transactions: transactions,
          agentID: agentID,
          txnId: txnId,
        };
      }

      // Return response
      return res.status(200).send(resDataToSend);
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   crete webhook api religare
   */
  //-------------------------------------------------------------------------

  async orderPaymentStatus(req: any, res: any) {
    try {
      const { orderId } = req.body;

      let getOrderResponse = await this.getUniqueTransactionId.paymentVerify(
        orderId
      );

      if (getOrderResponse) {
        return res.send(getOrderResponse.body);
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   crete webhook api religare
   */
  //-------------------------------------------------------------------------

  async getApplicationTypeAgainstOrderId(req: any, res: any) {
    try {
      const { orderId } = req.body;

      let transactions = await this.transactionModel.findOne({
        uniqueTransactionId: orderId,
      });

      if (!transactions) {
        throw new HttpException(`No transactions found.`, HttpStatus.OK);
      }
      let applicationTypeToSend = "";
      let { uniqueTransactionId, applicationDetails } = transactions;
      if (transactions.transactionFor == transactionFor.SERVICE_PAYMENT) {
        applicationDetails.forEach((el) => {
          applicationTypeToSend = el.applicationType;
        });
      } else {
        applicationTypeToSend = "OTHER";
      }

      return res.status(200).send({
        status: true,
        message: "Successfull!",
        data: {
          applicationType: applicationTypeToSend,
        },
      });
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   staus update api for app
   */
  //-------------------------------------------------------------------------

  async statusUpdateForApp(req: any, res: any) {
    try {
      console.log("transaction is updating...");
      let { orderId } = req.body;

      const currentDate = moment().utcOffset("+05:30").format("YYYY-MM-DD ");
      const txnData = await this.transactionModel
        .find({
          uniqueTransactionId: orderId,
        })
        .sort({ createdAt: -1 });

      if (!txnData.length) {
        console.log("Transaction not found");
      }

      for (const transaction of txnData) {
        let orderId = transaction.uniqueTransactionId;

        /**
         *
         * verify payment function to check transaction status use api  payment gateway
         *
         */
        const isPaymentVerified: any =
          await this.paytmFunctions.verifyTxnStatus(transaction);

        if (!isPaymentVerified.status) {
          throw new HttpException(isPaymentVerified.message, HttpStatus.OK);
        }

        /**
         *
         * txnDataToBeUpdated :to update transaction status and transaction Id received from pament gateway
         *
         */
        const txnDataToBeUpdated = {
          $set: {
            paymentStatus: isPaymentVerified.paymentStatus,
          },
        };

        /**
         *
         * appOrUserDataToBeUpdate :to update transaction status and transaction Id received from payment gateway into
         * application or user in case of subscription
         *
         */

        let appOrUserDataToBeUpdate;

        if (transaction.transactionFor === transactionFor.SERVICE_PAYMENT) {
          appOrUserDataToBeUpdate = {
            $set: { txnStatus: isPaymentVerified.paymentStatus },
          };
        }

        if (transaction.transactionFor === transactionFor.SUBSCRIPTION_PLAN) {
          appOrUserDataToBeUpdate = {
            $set: {
              subscriptionTxnStatus: isPaymentVerified.paymentStatus,
              subscriptionTxnDate: currentDate,
              subscriptionPayment:
                isPaymentVerified.paymentStatus === paymentStatus.SUCCESS
                  ? subscriptionPayment.SUCCESS
                  : subscriptionPayment.PENDING,
            },
          };
        }

        /**
         * update digital pan wallet in case of recharge wallet payment declined and failure
         */

        if (
          isPaymentVerified.paymentStatus === paymentStatus.SUCCESS &&
          transaction.transactionFor ===
            transactionFor.DIGITAL_PAN_WALLET_RECHARGE
        ) {
          const updateDigitalPanWallet =
            await this.TransactionHelper.updateDigitalPanWallet(
              req,
              orderId,
              isPaymentVerified.paymentStatus
            );

          if (!updateDigitalPanWallet.status) {
            console.log(updateDigitalPanWallet.msg);
          }
        }

        if (
          isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
          transaction.transactionFor ===
            transactionFor.DIGITAL_PAN_WALLET_RECHARGE
        ) {
          const updateDigitalPanWallet =
            await this.TransactionHelper.createDigitalPanWalletHistory(
              req,
              orderId,
              isPaymentVerified.paymentStatus
            );

          if (!updateDigitalPanWallet.status) {
            console.log(updateDigitalPanWallet.msg);
          }
        }

        const transactionUpdate = await this.TransactionHelper.updateTxnStatus(
          "NO",
          isPaymentVerified.paymentStatus,
          orderId,
          txnDataToBeUpdated,
          appOrUserDataToBeUpdate,
          req,
          res
        );

        if (!transactionUpdate.status) {
          console.log(transactionUpdate.msg);
        }

        /**find application */
        let applicationFound;
        let refundAmount;
        let rewardAmount;
        for (const applicationDetails of transaction.applicationDetails) {
          const { applicationType, applicationId, srn } = applicationDetails;

          applicationFound = await this.TransactionHelper.checkApplication(
            applicationId,
            applicationType
          );

          if (!applicationFound) {
            throw new HttpException("Application not found.", HttpStatus.OK);
          }
          let { refundWalletAmountApplied, rewardWalletAmountApplied } =
            applicationFound;
          refundAmount = refundWalletAmountApplied;
          rewardAmount = rewardWalletAmountApplied;

          /**
           * update refund and reward wallet in case of payment declined and failure
           */
          if (
            isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
            transaction.transactionFor === transactionFor.SERVICE_PAYMENT
          ) {
            //update reward wallet and reward transaction history
            if (rewardAmount > 0) {
              const updateRewardData =
                await this.TransactionHelper.updateRewardWallet(req, orderId);
              if (!updateRewardData.status) {
                console.log(updateRewardData.msg);
              }
            }

            //update refund wallet and refund transaction history
            if (refundAmount > 0) {
              const updateRefundData =
                await this.TransactionHelper.updateRefundWallet(req, orderId);
              if (!updateRefundData.status) {
                console.log(updateRefundData.msg);
              }
            }

            //update  refund and reward amount applied in application
            if (refundAmount > 0 || rewardAmount > 0) {
              const updateApplicationAmt =
                await this.TransactionHelper.updateApplicationAmt(orderId);
              if (!updateApplicationAmt.status) {
                console.log(updateApplicationAmt.msg);
              }
            }
          }
        }

        return res.send({
          status: true,
          message: "Order updated successfully",
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}
