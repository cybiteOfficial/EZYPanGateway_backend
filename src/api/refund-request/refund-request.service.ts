import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  RefundRequest,
  RefundRequestDocument,
  RequestStatus,
} from "./entities/refund-request.entity";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import * as moment from "moment";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { changeRefundRequestStatus } from "../../helper/changeStatus";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsDocument,
  transactionType,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import {
  isAccountNumberValid,
  isValidIFSC,
} from "../../helper/basicValidation";
import { User, UserDocument } from "../user/entities/user.entity";

@Injectable()
export class RefundRequestService {
  [x: string]: any;
  constructor(
    @InjectModel(RefundRequest.name)
    private refundRequestModel: Model<RefundRequestDocument>,
    @InjectModel(RefundWallet.name)
    private refundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(Admin.name)
    private adminModel: Model<adminDocument>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    @InjectModel(RefundWalletTransactions.name)
    private refundTransaction: Model<RefundWalletTransactionsDocument>,
    private readonly addLogFunction: AddLogFunction
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new RefundRequest
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        refundRequestedAmount,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        confirmAccountNumber,
      } = req.body;
      const reqParams = [
        "refundRequestedAmount",
        "accountHolderName",
        "accountNumber",
        "ifscCode",
        "bankName",
        "confirmAccountNumber",
      ];
      const requiredKeys = [
        "refundRequestedAmount",
        "accountHolderName",
        "accountNumber",
        "ifscCode",
        "bankName",
        "confirmAccountNumber",
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

      if (!isAccountNumberValid(accountNumber)) {
        throw new HttpException(
          `Account Number must be valid Account number.`,
          HttpStatus.OK
        );
      }

      // if (!isValidIFSC(ifscCode)) {
      //   throw new HttpException(
      //     `IFSC must be valid code number.`,
      //     HttpStatus.OK,
      //   );
      // }

      if (accountNumber !== confirmAccountNumber) {
        throw new HttpException(
          `Bank Account Number and Confirm Account Number should be matched.`,
          HttpStatus.OK
        );
      }

      const refundWalletFound = await this.refundWalletModel.findOne({
        userId: req.userData.Id,
      });

      if (!refundWalletFound) {
        throw new HttpException(`Wallet not found.`, HttpStatus.OK);
      }

      const refundWalletAmount = refundWalletFound.walletAmount;

      if (refundWalletAmount < refundRequestedAmount) {
        throw new HttpException(
          "Insufficient balance in wallet.",
          HttpStatus.OK
        );
      }

      let { walletAmount, freezeAmount } = refundWalletFound;
      let remainingAmount = walletAmount - freezeAmount;

      if (remainingAmount < 100 || req.body.refundRequestedAmount < 100) {
        throw new HttpException(`Minimum amount must be 100.`, HttpStatus.OK);
      }
      if (remainingAmount < refundRequestedAmount) {
        throw new HttpException(
          `Requested amount must be less than ${remainingAmount} Rs.`,
          HttpStatus.OK
        );
      }
      const dataToBeInsert = {
        ...req.body,
        appliedById: req.userData.Id,
        appliedByType: req.userData.type,
        appliedOnDate: moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss"),
      };

      const addRequest = await new this.refundRequestModel({
        ...dataToBeInsert,
      }).save();

      if (!addRequest) {
        throw new HttpException("Unable to add refund request.", HttpStatus.OK);
      }

      const refundWalletUpdate = await this.refundWalletModel.findByIdAndUpdate(
        {
          _id: refundWalletFound._id,
        },
        {
          $set: {
            freezeAmount: freezeAmount + parseInt(refundRequestedAmount),
          },
        },
        { new: true }
      );

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "REFUND_REQUEST",
        "REFUND_REQUEST_ADD",
        addRequest._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added refund request at ${currentDate}.`,
        "Refund request added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Refund request added successfully.",
        status: true,
        data: addRequest,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "REFUND_REQUEST",
        "REFUND_REQUEST_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to add refund request with this credentials at ${moment()
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
        "refundRequestedAmount",
        "refundedAmount",
        "accountHolderName",
        "accountNumber",
        "ifscCode",
        "bankName",
        "isDeleted",
        "isActive",
        "createdAt",
        "updatedAt",
      ];

      let matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }, { isActive: true }],
      };

      if (!req.route.path.includes("/admin/")) {
        matchQuery = {
          $and: [
            { appliedById: req.userData.Id },
            { isDeleted: false },
            { isActive: true },
            // {
            //   $or: [
            //     {
            //       appliedByType: req.userData.type,
            //     },
            //   ],
            // },
          ],
        };
      }

      const query = [];
      const filterQuery = [];

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
      const booleanFields = ["isActive", "isDeleted", "amount"];
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
      const additionaQuery = [
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
            userName: { $arrayElemAt: ["$user.name", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            mobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
          },
        },
        {
          $addFields: {
            refundRecieveAmt: {
              $subtract: [
                "$refundRequestedAmount",
                {
                  $multiply: ["$refundRequestedAmount", { $divide: [30, 100] }],
                },
              ],
            },
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
      const dataFound = await this.refundRequestModel.aggregate(countQuery);

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

      const result = await this.refundRequestModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "REFUND_REQUEST",
          "REFUND_REQUEST_FILTER_PAGINATION",
          requestedId,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view refund request at ${currentDate}.`,
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
        "REFUND_REQUEST",
        "REFUND_REQUEST_FILTER_PAGINATION",
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
  /***
   * update all status
   */
  //-------------------------------------------------------------------------
  async updateStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const requestedName = req.userData?.userName || "";

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const refundRequestFound = await this.refundRequestModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (!refundRequestFound) {
        throw new HttpException(`Refund Request not found.`, HttpStatus.OK);
      }
      const refundWallet = await this.refundWalletModel.findOne({
        userId: refundRequestFound.appliedById,
      });
      if (!refundWallet) {
        throw new HttpException(`Refund wallet not found.`, HttpStatus.OK);
      }

      let { walletAmount, freezeAmount } = refundWallet;
      let remainingAmount =
        freezeAmount - refundRequestFound.refundRequestedAmount;

      const refundRequestStatus = refundRequestFound.status;

      const activeStatus = changeRefundRequestStatus(
        refundRequestStatus,
        req.body.requestedStatus
      );

      let IdkeyToUpdate = "";
      let NamekeyToUpdate = "";
      let DatekeyToInsert = "";
      let finalAmount = 0;

      let userType = req.userData.type;

      if (userType === "ADMIN" || userType === "SUPER_ADMIN") {
        userType = "ADMIN";
      }

      let RefundRequestRemark = "";

      const refundWalletAmount = refundWallet.walletAmount;
      const refundRequestAmount = refundRequestFound.refundRequestedAmount;
      const deductedWalletAmount = refundWalletAmount - refundRequestAmount;

      if (req.body.requestedStatus === RequestStatus.REJECT) {
        IdkeyToUpdate = "rejectedById";
        NamekeyToUpdate = "rejectedByName";
        DatekeyToInsert = "rejectedOnDate";
        finalAmount =
          (refundRequestAmount *
            (100 - parseFloat(process.env.REFUNDBALANCE))) /
          100;
        RefundRequestRemark = `Refund request with amount ${refundRequestAmount} ${req.body.requestedStatus} by ${userType}.`;

        finalAmount = 0;
      }

      if (req.body.requestedStatus === RequestStatus.COMPLETE) {
        IdkeyToUpdate = "completedById";
        NamekeyToUpdate = "completedByName";
        DatekeyToInsert = "completedOnDate";
        //deducted 30% amount from total requested amountADMIN Codiotic.Test01 COMPLETE Refund Request Of DISTRIBUTOR With Amount 70.

        finalAmount =
          (refundRequestAmount *
            (100 - parseFloat(process.env.REFUNDBALANCE))) /
          100;

        RefundRequestRemark = `Refund request with amount ${refundRequestAmount} ${req.body.requestedStatus} by ${userType}.`;
      }

      const dataToUpdate = {
        refundedAmount: finalAmount,
        status: activeStatus,
        [IdkeyToUpdate]: requestedId,
        [NamekeyToUpdate]: requestedName,
        [DatekeyToInsert]: currentDate,
        remark: req.body.remark ? req.body.remark : RefundRequestRemark,
        transactionId: req.body.transactionNumber,
      };

      const updatedRequest = await this.refundRequestModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            ...dataToUpdate,
          },
        },
        { new: true }
      );

      if (!updatedRequest) {
        throw new HttpException(
          `Unable to update refund request.`,
          HttpStatus.OK
        );
      }

      let amountToBeUpdate;

      if (req.body.requestedStatus === RequestStatus.REJECT) {
        amountToBeUpdate = {
          _id: refundWallet._id,
          freezeAmount: remainingAmount,
          remark: RefundRequestRemark,
        };

        /***add refund amount  */
        const addRefundAmount = await this.addRefundAmount(
          req,
          refundRequestFound.refundRequestedAmount,
          refundRequestFound.appliedById,
          userType
        );
      }

      if (req.body.requestedStatus === RequestStatus.COMPLETE) {
        amountToBeUpdate = {
          _id: refundWallet._id,
          freezeAmount: remainingAmount,
          remark: RefundRequestRemark,
          walletAmount: deductedWalletAmount,
        };

        const transactionRemark = `${userType} ${req.userData.userName} ${req.body.requestedStatus} refund request of ${updatedRequest.appliedByType} with amount ${updatedRequest.refundRequestedAmount}.`;

        const transactionData = {
          walletId: refundWallet._id,
          userId: refundRequestFound.appliedById,
          transactionType: transactionType.DEBIT,
          debitedAmount: updatedRequest.refundRequestedAmount,
          transactionId: req.body.transactionNumber,
          dateAndTime: currentDate,
          remark: transactionRemark,
          createdById: req.userData.Id,
          createdByType: req.userData.type,
        };

        const createWalletTransaction = await new this.refundTransaction({
          ...transactionData,
        }).save();
      }

      await this.refundWalletModel.findByIdAndUpdate(
        {
          _id: refundWallet._id,
        },
        {
          $set: { ...amountToBeUpdate },
        },
        { new: true }
      );

      if (updatedRequest) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "REFUND_REQUEST",
          "REFUND_REQUEST_STATUS",
          id,
          true,
          200,
          `${requestedType} ${req.userData.userName} change status of refund request ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus.replace(
            /_/g,
            " "
          )} of refund request ${id} successfully.`,
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
        "REFUND_REQUEST",
        "REFUND_REQUEST_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to change status of refund request ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  /**
   * add amount in refund wallet
   */

  async addRefundAmount(
    req: any,
    amount: number,
    userId: any,
    userDataType: any
  ) {
    const currentDateTime = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");
    let resToSend = { status: false, Msg: "" };
    const userExist = await this.UserModel.findOne({
      isDeleted: false,
      isActive: true,
      isBlocked: false,
    });
    if (!userExist) {
      resToSend.Msg = "Invalid user.";
    }

    //check wallet details
    const walletDetails = await this.refundWalletModel.findOne({
      userId: userId,
    });
    if (!walletDetails) {
      resToSend.Msg = "Wallet not found.";
    }

    // let creditedAmount = amount + refundUsed + rewardUsed;
    let creditedAmount = amount;
    const walletTransactionData = {
      walletId: walletDetails._id,
      userId: userId,
      transactionType: "CREDIT",
      debitedAmount: 0,
      creditedAmount: creditedAmount,
      dateAndTime: currentDateTime,
      createdByType: userDataType,
      remark: `Refund wallet amount ${creditedAmount} credited For Rejected Refund Request  with amount ${amount}.`,
      createdById: userId,
    };

    const walletUpdated = await this.refundWalletModel.findByIdAndUpdate(
      { _id: walletDetails._id },
      {
        $set: {
          freezeAmount:
            walletDetails.freezeAmount - amount > 0
              ? 0
              : walletDetails.freezeAmount - amount,
        },
      }
    );

    if (!walletUpdated) {
      resToSend.Msg = `Couldn't refund amount.`;
    } else {
      if (creditedAmount > 0) {
        // const walletTransactionCreated = await new this.refundTransaction({
        //   ...walletTransactionData,
        // }).save();

        // const msgToSend = "";
        // if (walletTransactionCreated) {
        //   resToSend = {
        //     status: true,
        //     Msg: "Amount successfully added in wallet.",
        //   };
        // } else {
        //   resToSend.Msg = "Couldn't add walletTransaction details.";
        // }
        return resToSend;
      } else {
        return true;
      }
    }
  }
}
