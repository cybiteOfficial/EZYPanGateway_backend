import { WalletAmt } from "./../digital-pan-wallet/digital-pan-wallet.helper";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import * as moment from "moment";
import mongoose, { Model } from "mongoose";
import { AddLogFunction } from "../../helper/addLog";
import { errorRes } from "../../helper/errorRes";

import { InjectModel } from "@nestjs/mongoose";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsDocument,
  transactionType,
} from "./entities/refund-wallet-transaction.entity";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";

@Injectable()
export class RefundWalletTransactionService {
  [x: string]: any;
  constructor(
    @InjectModel(RefundWalletTransactions.name)
    private RefundWalletTransactionsModel: Model<RefundWalletTransactionsDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    private readonly addLogFunction: AddLogFunction
  ) {}

  //-------------------------------------------------------------------------
  /***
   *create history
   */
  //-------------------------------------------------------------------------

  async add(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let {
        userId,
        applicationType,
        transactionType,

        remark,
      } = req.body;

      let amountToBeUpdate = Number(req.body.amountToBeUpdate);
      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can add refund transactions.",
          HttpStatus.OK
        );
      }

      /****find wallet */
      const refundWalletFound = await this.RefundWalletModel.findOne({
        userId: userId,
      });

      if (!refundWalletFound) {
        throw new HttpException("Wallet not found.", HttpStatus.OK);
      }

      /***created transaction histroy */
      const refundWalletTransactionsToBeInsert = {
        walletId: refundWalletFound._id.toString(),
        userId: userId,
        applicationType: applicationType,
        applicationId: "",
        transactionType: transactionType,
        uniqueTransactionId: "",
        srn: "",
        sjbtCode: req.userData.sjbtCode,
        debitedAmount: transactionType == "DEBIT" ? amountToBeUpdate : 0,
        creditedAmount: transactionType == "CREDIT" ? amountToBeUpdate : 0,
        dateAndTime: currentDate,
        createdByType: "SUPER_ADMIN",
        remark: remark,
        createdById: userId,
        isManual: true,
      };

      const createRefundTransaction =
        await new this.RefundWalletTransactionsModel({
          ...refundWalletTransactionsToBeInsert,
        }).save();

      if (!createRefundTransaction) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      /****update refuund wallet */
      let walletToBeUpdate =
        transactionType == "DEBIT"
          ? refundWalletFound.walletAmount - amountToBeUpdate
          : refundWalletFound.walletAmount + amountToBeUpdate;
      const refundWallet = await this.RefundWalletModel.findByIdAndUpdate(
        {
          _id: refundWalletFound._id,
        },
        {
          $set: { walletAmount: walletToBeUpdate },
        },
        {
          new: true,
        }
      );

      return res.status(200).send({
        message: "Data added successfully.",
        status: true,
        data: createRefundTransaction,
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
   *update history
   */
  //-------------------------------------------------------------------------

  async update(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let {
        userId,
        applicationType,
        transactionType,

        remark,
      } = req.body;

      let amountToBeUpdate = Number(req.body.amountToBeUpdate);
      /***get data */
      const oldRefundWalletHistoryFound =
        await this.RefundWalletTransactionsModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!oldRefundWalletHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      /****find wallet */
      const refundWalletFound = await this.RefundWalletModel.findOne({
        userId: userId,
      });

      if (!refundWalletFound) {
        throw new HttpException("Wallet not found.", HttpStatus.OK);
      }

      // /***created transaction histroy */
      const refundWalletTransactionsToBeInsert = {
        applicationType: applicationType,
        applicationId: "",
        transactionType: transactionType,
        uniqueTransactionId: "",
        srn: "",
        sjbtCode: req.userData.sjbtCode,
        debitedAmount: transactionType == "DEBIT" ? amountToBeUpdate : 0,
        creditedAmount: transactionType == "CREDIT" ? amountToBeUpdate : 0,
        dateAndTime: currentDate,
        createdByType: "SUPER_ADMIN",
        remark: remark,
        isManual: true,
      };

      const createRefundTransaction =
        await this.RefundWalletTransactionsModel.findByIdAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          {
            $set: { ...refundWalletTransactionsToBeInsert },
          },
          {
            new: true,
          }
        );

      if (!createRefundTransaction) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      /****old amount */
      let oldAmount =
        oldRefundWalletHistoryFound.transactionType == "DEBIT"
          ? oldRefundWalletHistoryFound.debitedAmount
          : oldRefundWalletHistoryFound.creditedAmount;

      let currentAmount =
        createRefundTransaction.transactionType == "DEBIT"
          ? createRefundTransaction.debitedAmount
          : createRefundTransaction.creditedAmount;

      // let udateAmount =
      //   oldRefundWalletHistoryFound.transactionType == "CREDIT"
      //     ?( createRefundTransaction.transactionType == "CREDIT"
      //       ? refundWalletFound.walletAmount - oldAmount + currentAmount
      //       : refundWalletFound.walletAmount + oldAmount - currentAmount)
      //     : (createRefundTransaction.transactionType == "DEBIT"
      //     ? refundWalletFound.walletAmount + oldAmount - currentAmount
      //     : refundWalletFound.walletAmount + oldAmount + currentAmount);

      let udateAmount;

      if (oldRefundWalletHistoryFound.transactionType === "CREDIT") {
        if (createRefundTransaction.transactionType === "CREDIT") {
          udateAmount =
            refundWalletFound.walletAmount - oldAmount + currentAmount;
        } else {
          if (oldAmount == currentAmount) {
            udateAmount =
              refundWalletFound.walletAmount - oldAmount - currentAmount;
          } else {
            udateAmount =
              refundWalletFound.walletAmount - oldAmount - currentAmount;
          }
        }
      } else {
        if (createRefundTransaction.transactionType === "DEBIT") {
          udateAmount =
            refundWalletFound.walletAmount + oldAmount - currentAmount;
        } else {
          udateAmount =
            refundWalletFound.walletAmount + oldAmount + currentAmount;
        }
      }

      /****update refuund wallet */
      let walletToBeUpdate =
        transactionType == "DEBIT"
          ? refundWalletFound.walletAmount - amountToBeUpdate
          : refundWalletFound.walletAmount + amountToBeUpdate;
      const refundWallet = await this.RefundWalletModel.findByIdAndUpdate(
        {
          _id: refundWalletFound._id,
        },
        {
          $set: { walletAmount: udateAmount },
        },
        {
          new: true,
        }
      );

      return res.status(200).send({
        message: "Data updated successfully.",
        status: true,
        data: createRefundTransaction,
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
   *view
   */
  //-------------------------------------------------------------------------

  async viewAdmin(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      /***get data */
      const refundWalletHistoryFound =
        await this.RefundWalletTransactionsModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!refundWalletHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: refundWalletHistoryFound,
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
   *deleted history
   */
  //-------------------------------------------------------------------------

  async delete(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let {
        userId,
        applicationType,
        transactionType,

        remark,
      } = req.body;

      let amountToBeUpdate = Number(req.body.amountToBeUpdate);
      /***get data */
      const refundWalletHistoryFound =
        await this.RefundWalletTransactionsModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!refundWalletHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      const createRefundTransaction =
        await this.RefundWalletTransactionsModel.findByIdAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          {
            $set: { isDeleted: true },
          },
          {
            new: true,
          }
        );

      if (!createRefundTransaction) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      /****update refuund wallet */
      // let walletToBeUpdate =
      //   transactionType == "DEBIT"
      //     ? refundWalletFound.walletAmount - amountToBeUpdate
      //     : refundWalletFound.walletAmount + amountToBeUpdate;
      // const refundWallet = await this.RefundWalletModel.findByIdAndUpdate(
      //   {
      //     _id: refundWalletFound._id,
      //   },
      //   {
      //     $set: { walletAmount: walletToBeUpdate },
      //   },
      //   {
      //     new: true,
      //   }
      // );

      return res.status(200).send({
        message: "Data deleted successfully.",
        status: true,
        data: createRefundTransaction,
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
   * find refund wallet
   */
  //-------------------------------------------------------------------------

  async view(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        userId: req.userData.Id,
      };

      const dataFound = await this.RefundWalletTransactionsModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
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
          $addFields: {
            userName: { $arrayElemAt: ["$user.name", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            mobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
          },
        },
        {
          $unset: "user",
        },
      ]);

      if (!dataFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "REFUND_WALLET_TRANSACTION",
        "REFUND_WALLET_TRANSACTION_LIST",
        req.userData.Id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } list wallet transactions ${req.userData.Id} at ${currentDate}.`,
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
        "REFUND_WALLET_TRANSACTION",
        "REFUND_WALLET_TRANSACTION_LIST",
        req.userData.Id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to  list wallet transactions ${
          req.userData.Id
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
   * all with filter pagination
   */
  //-------------------------------------------------------------------------
  async allWithFilters(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
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
        "walletType",
        "walletAmount",
        "walletId",
        "userId",
        "applicationType",
        "applicationId",
        "srn",
        "sjbtCode",
        "transactionType",
        "debitedAmount",
        "creditedAmount",
        "uniqueTransactionId",
        "createdByType",
        "createdById",
        "paymentStatus",
        "dateAndTime",
        "remark",
        "uuid",
        "userName",
        "email",
        "mobileNumber",
        "createdAt",
        "isDeleted",
        "isActive",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
      };

      if (req.route.path.includes("/web/")) {
        matchQuery = {
          $and: [{ isDeleted: false, userId: req.userData.Id }],
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
        //rangeFilterBy !== {} &&
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
      const numberFileds = ["walletAmount", "debitedAmount", "creditedAmount"];

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

      //get start date and end date of month
      let month = req.body.dateFilter.month;
      let year = req.body.dateFilter.year;
      const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD");
      const endDate = moment(startDate).endOf("month");
      dateFilter.start_date = startDate;
      dateFilter.end_date = endDate;

      if (month === undefined || month === "") {
        dateFilter.start_date = "";
      }
      if (year === undefined || year === "") {
        dateFilter.end_date = "";
      }

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
        if (
          dateFilter.start_date !== "" &&
          dateFilter.end_date !== "" &&
          dateFilter.start_date !== undefined &&
          dateFilter.end_date !== undefined &&
          dateFilter.start_date !== null &&
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
          $addFields: {
            userName: { $arrayElemAt: ["$user.name", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            mobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
          },
        },
        {
          $unset: "user",
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;

      const dataFound = await this.RefundWalletTransactionsModel.aggregate(
        countQuery
      );

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

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await this.RefundWalletTransactionsModel.aggregate(query);

      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "REFUND_WALLET_TRANSACTION",
          "REFUND_WALLET_TRANSACTION_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view wallet transactions at ${currentDate}.`,
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
        "REFUND_WALLET_TRANSACTION",
        "REFUND_WALLET_TRANSACTION_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data  with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
