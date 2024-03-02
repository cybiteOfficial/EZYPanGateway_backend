import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  RewardValueConfig,
  RewardValueConfigDocument,
} from "./entities/rewardValueConfig.entity";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import {
  RewardValueConfigHistory,
  RewardValueConfigHistoryDocument,
} from "../rewardValueConfigHistory/entities/rewardValueConfigHistory.entity";
import {
  RewardHistory,
  RewardHistoryDocument,
  rewardFor,
} from "../rewardHistory/entities/rewardHistory.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";

@Injectable()
export class RewardPointService {
  [x: string]: any;
  constructor(
    @InjectModel(RewardValueConfig.name)
    private rewardPointModel: Model<RewardValueConfigDocument>,
    @InjectModel(RewardValueConfigHistory.name)
    private rewardPointLogModel: Model<RewardValueConfigHistoryDocument>,
    @InjectModel(RewardHistory.name)
    private userRewardModel: Model<RewardHistoryDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    private readonly addLogFunction: AddLogFunction
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new reward point
   */
  //-------------------------------------------------------------------------

  // async add(res, req) {
  //   try {
  //     const requestedId = req.userData?.Id || '';
  //     const requestedType = req.userData?.type || '';
  //     const currentDate = moment()
  //       .utcOffset('+05:30')
  //       .format('YYYY-MM-DD HH:mm:ss');

  //     const result = await new this.rewardPointModel({ ...req.body }).save();

  //     if (!result) {
  //       throw new HttpException('Unable to add reward point.', HttpStatus.OK);
  //     }

  //     this.addLogFunction.logAdd(
  //       req,
  //       requestedType,
  //       requestedId,
  //       'REWARD_POINT',
  //       'REWARD_POINT_ADD',
  //       result._id,
  //       true,
  //       200,
  //       `${requestedType} ${
  //         req.userData?.contactNumber || ''
  //       } added reward point at ${currentDate}.`,
  //       'Reward point added successfully.',
  //       req.socket.remoteAddress,
  //     );
  //     return res.status(200).send({
  //       message: 'Data added successfully.',
  //       status: true,
  //       data: result,
  //       code: 'CREATED',
  //       issue: null,
  //     });
  //   } catch (err) {
  //     const errData = errorRes(err);
  //     this.addLogFunction.logAdd(
  //       req,
  //       req.userData?.type || '',
  //       req.userData?.Id || '',
  //       'REWARD_POINT',
  //       'REWARD_POINT_ADD',
  //       '',
  //       errData.resData.status,
  //       errData.statusCode,
  //       `${req.userData?.type || ''} ${req.userData?.contactNumber || ''} ${
  //         req.userData?.Id || ''
  //       } tried to add reward point with this credentials at ${moment()
  //         .utcOffset('+05:30')
  //         .format('YYYY-MM-DD HH:mm:ss')}.`,
  //       errData.resData.message,
  //       req.socket.remoteAddress,
  //     );

  //     return res.status(errData.statusCode).send({ ...errData.resData });
  //   }
  // }

  //-------------------------------------------------------------------------
  /***
   * update reward point
   */
  //-------------------------------------------------------------------------

  async update_by_id(id, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (!req.body.perRupeeRewardValue) {
        throw new HttpException(
          "Reward point value is required.",
          HttpStatus.OK
        );
      }

      const rewardPointFound = await this.rewardPointModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      if (!rewardPointFound) {
        throw new HttpException("Reward point not found.", HttpStatus.OK);
      }

      const result = await this.rewardPointModel.findByIdAndUpdate(
        {
          _id: rewardPointFound._id,
        },
        { $set: { ...req.body } },
        { new: true }
      );

      if (!result) {
        throw new HttpException(
          "Unable to update reward point.",
          HttpStatus.OK
        );
      }

      const updatedDataToBeInsetForLog = {
        previousRewardValue: rewardPointFound.perRupeeRewardValue,
        updatedRewardValue: req.body.perRupeeRewardValue,
        updatedById: req.userData.Id,
        updatedByType: req.userData.type,
        updatedOnDate: currentDate,
        remark: `Reward point value updated from ${rewardPointFound.perRupeeRewardValue} to ${req.body.perRupeeRewardValue} by ${req.userData.type} ${req.userData.Id} at ${currentDate}`,
      };

      const rewardLogFound = await new this.rewardPointLogModel({
        ...updatedDataToBeInsetForLog,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "REWARD_POINT",
        "REWARD_POINT_UPDATE",
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated reward point at ${currentDate}.`,
        "Reward point updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Reward point updated successfully.",
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
        "REWARD_POINT",
        "REWARD_POINT_UPDATE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to update reward point with this credentials at ${moment()
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
   * get all reward point
   */
  //-------------------------------------------------------------------------

  async getAll(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const rewardPointFound = await this.rewardPointModel.find();

      if (!rewardPointFound.length) {
        throw new HttpException("Reward point not found.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "REWARD_POINT",
        "REWARD_POINT_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of reward point at ${currentDate}.`,
        "Reward point found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Reward point found successfully.",
        status: true,
        data: rewardPointFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "REWARD_POINT",
        "REWARD_POINT_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to checked list reward point with this credentials at ${moment()
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
  async allWithFilter(res, req) {
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
        "previousRewardValue",
        "updatedRewardValue",
        "updatedById",
        "updatedByType",
        "updatedOnDate",
        "remark",
        "isDeleted",
        "isActive",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }, { isActive: true }],
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
      const numberFileds = ["previousRewardValue", "updatedRewardValue"];

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
      const additionaQuery = [];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.rewardPointLogModel.aggregate(countQuery);
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

      const result = await this.rewardPointLogModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "REWARD_POINT_LOG",
          "REWARD_POINT_LOG_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view reward point logs at ${currentDate}.`,
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
        "REWARD_POINT_LOG",
        "REWARD_POINT_LOG_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data of reward point logs with this credentials at ${moment()
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
   * all user reward with filter pagination
   */
  //-------------------------------------------------------------------------
  async userRewardWithFilterForAdmin(res, req) {
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
        "points",
        "applicationType",
        "logs",
        "isDeleted",
        "isActive",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }, { isActive: true }],
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
      const numberFileds = ["points"];

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
          $match: { userId: { $ne: "" } },
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
          $unset: ["user", "user_id"],
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.userRewardModel.aggregate(countQuery);
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

      const result = await this.userRewardModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "USER_REWARD_POINT_LOG",
          "USER_REWARD_POINT_LOG_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view user reward point logs at ${currentDate}.`,
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
        "USER_REWARD_POINT_LOG",
        "USER_REWARD_POINT_LOG_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data of user reward point logs with this credentials at ${moment()
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
   * get all reward point of logged in user
   */
  //-------------------------------------------------------------------------

  async userRewardList(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        userId: req.userData.Id,
        isAtive: true,
        isDeleted: false,
      };

      const rewardPointFound = await this.userRewardModel
        .find({ ...query })
        .sort({ createdAt: -1 });

      if (!rewardPointFound.length) {
        throw new HttpException("Reward point not found.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked his list of reward point at ${currentDate}.`,
        "Reward point found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Reward point found successfully.",
        status: true,
        data: rewardPointFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to checked his list of reward point with this credentials at ${moment()
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
   * total reward point of logged in user
   */
  //-------------------------------------------------------------------------

  async userRewardTotalAmountForApplication(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        userId: req.userData.Id,
      };

      const rewardPointFound = await this.UserRewardWalletModel.findOne({
        ...query,
      });

      const rewardPointValue = await this.rewardPointModel.findOne({
        isDeleted: false,
      });

      if (!rewardPointFound) {
        throw new HttpException("User reward wallet not found.", HttpStatus.OK);
      }

      const totalPoints = rewardPointFound.totalReward;
      if (totalPoints === undefined || totalPoints === null) {
        throw new HttpException(
          "Unable to find total reward points.",
          HttpStatus.OK
        );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_TOTAL",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked total reward point at ${currentDate}.`,
        "Reward point found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Total reward point found successfully.",
        status: true,
        data: {
          totalRewardPoints: totalPoints,
          rewardPointValue: rewardPointValue.perRupeeRewardValue,
        },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_TOTAL",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to checked total reward point with this credentials at ${moment()
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
   * total reward point of logged in user
   */
  //-------------------------------------------------------------------------

  async userRewardTotalPoint(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        userId: req.userData.Id,
      };

      const rewardPointFound = await this.userRewardModel.find({
        ...query,
      });

      let totalPoints = 0;
      if (rewardPointFound.length) {
        let creditReward = rewardPointFound.filter((el) => {
          return el.rewardTransactionType === "CREDIT";
        });
        let debitedReward = rewardPointFound.filter((el) => {
          return el.rewardTransactionType === "DEBIT";
        });
        let totalcreditReward = 0;
        let totaldebitedReward = 0;
        if (creditReward.length) {
          totalcreditReward = creditReward.reduce((acc, rewards) => {
            return acc + rewards.points;
          }, 0);
        }

        if (debitedReward.length) {
          totaldebitedReward = debitedReward.reduce((acc, rewards) => {
            return acc + rewards.points / rewards.rewardPointValue;
          }, 0);
        }

        if (totalcreditReward > 0) {
          totalPoints = totalcreditReward - totaldebitedReward;
        } else {
          totalPoints = totaldebitedReward;
        }
      }

      if (!rewardPointFound.length) {
        throw new HttpException("User reward wallet not found.", HttpStatus.OK);
      }

      if (totalPoints === undefined || totalPoints === null) {
        throw new HttpException(
          "Unable to find total reward points.",
          HttpStatus.OK
        );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_TOTAL",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked total reward point at ${currentDate}.`,
        "Reward point found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Total reward point found successfully.",
        status: true,
        data: { totalRewardPoints: totalPoints },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_TOTAL",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to checked total reward point with this credentials at ${moment()
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
   * get reward points fro admin
   */
  //-------------------------------------------------------------------------

  async getUserWalletAdmin(id, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = {
        userId: id,
        isDeleted: false,
      };
      if (requestedType !== "SUPER_ADMIN") {
        throw new HttpException(
          "You don't have permission to access this route.",
          HttpStatus.OK
        );
      }

      const userRewardWalletFound = await this.UserRewardWalletModel.find({
        ...query,
      });

      if (!userRewardWalletFound) {
        throw new HttpException("User reward wallet not found.", HttpStatus.OK);
      }

      return res.status(200).send({
        message: "Wallet found successfully.",
        status: true,
        data: userRewardWalletFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "USER_REWARD_POINT",
        "USER_REWARD_POINT_TOTAL",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to checked total reward point with this credentials at ${moment()
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
   * get reward points fro admin
   */
  //-------------------------------------------------------------------------

  async updateUserWalletAdmin(id, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let { userId, amountToBeUpdate } = req.body;
      console.log(req.body);
      if (requestedType !== "SUPER_ADMIN") {
        throw new HttpException(
          "You don't have permission to access this route.",
          HttpStatus.OK
        );
      }
      // let transactionTypeToUpdate = req.body.transactionType.toUpperCase();
      let query = {
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      };

      // /**get userId***/
      // const userFound = await this.userModel.findOne({
      //   ...query,
      // });

      // if (!userFound) {
      //   throw new HttpException("User not found.", HttpStatus.OK);
      // }

      /**get wallet***/
      const userWallet = await this.UserRewardWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });

      if (!userWallet) {
        throw new HttpException("Refund Wallet not found.", HttpStatus.OK);
      }

      const dataFound = await this.UserRewardWalletModel.findOneAndUpdate(
        {
          userId: userId,
          isDeleted: false,
        },
        {
          $set: {
            totalReward: amountToBeUpdate,
          },
        },
        {
          new: true,
        }
      );
      console.log(dataFound);
      if (!dataFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      return res.status(200).send({
        message: "Wallet updated Successfully.",
        status: true,
        data: dataFound,
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
   * user reward history
   */
  //-------------------------------------------------------------------------
  async userRewardHistory(res, req) {
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
        "points",
        "applicationType",
        "applicationId",
        "srn",
        "retailerId",
        "rewardFor",
        "rewardTransactionType",
        "logs",
        "isDeleted",
        "isActive",
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
      const booleanFields = ["isActive", "isDeleted"];
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
          $unset: ["user", "user_id"],
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.userRewardModel.aggregate(countQuery);
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

      const result = await this.userRewardModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "USER_REWARD_POINT_LOG",
          "USER_REWARD_POINT_LOG_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view user reward point logs at ${currentDate}.`,
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
        "USER_REWARD_POINT_LOG",
        "USER_REWARD_POINT_LOG_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data of user reward point logs with this credentials at ${moment()
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
   *created reward history
   */
  //-------------------------------------------------------------------------

  async add(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let { userId, applicationType, transactionType, remark } = req.body;

      let rewardPoints = Number(req.body.rewardPoints);
      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can add refund transactions.",
          HttpStatus.OK
        );
      }

      const rewardPointValue = await this.rewardPointModel.find();
      const rewardWalletFound = await this.UserRewardWalletModel.findOne({
        userId: userId,
      });

      const rewardHistoryData = {
        userId: userId,
        points: rewardPoints,
        rewardPointValue: rewardPointValue[0].perRupeeRewardValue,
        applicationType: applicationType,
        applicationId: "",
        uniqueTransactionId: "",
        srn: "",
        sjbtCode: req.userData.sjbtCode,
        retailerId: "",
        rewardFor: rewardFor.APPLICATIONAPPLIED,
        rewardTransactionType: transactionType,
        logs: remark,
        isManual: true,
      };

      const rewardHistory = await new this.userRewardModel({
        ...rewardHistoryData,
      }).save();

      if (!rewardHistory) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      /****update refuund wallet */

      let walletToBeUpdate =
        transactionType == "DEBIT"
          ? rewardWalletFound.totalReward -
            rewardPoints * rewardPointValue[0].perRupeeRewardValue
          : rewardWalletFound.totalReward +
            rewardPoints * rewardPointValue[0].perRupeeRewardValue;
      const rewardWalletUpdated =
        await this.UserRewardWalletModel.findByIdAndUpdate(
          {
            _id: rewardWalletFound._id,
          },
          {
            $set: {
              totalReward: walletToBeUpdate,
            },
          },
          { new: true }
        );

      return res.status(200).send({
        message: "Data added successfully.",
        status: true,
        data: rewardHistory,
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

      let { userId, applicationType, transactionType, rewardPoints, remark } =
        req.body;

      let amountToBeUpdate = Number(req.body.amountToBeUpdate);
      /***get data */
      const oldRewardHistory = await this.userRewardModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!oldRewardHistory) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      const rewardPointValue = await this.rewardPointModel.find();
      const rewardWalletFound = await this.UserRewardWalletModel.findOne({
        userId: userId,
      });

      const rewardHistoryData = {
        userId: userId,
        points: rewardPoints,
        rewardPointValue: rewardPointValue[0].perRupeeRewardValue,
        applicationType: applicationType,
        applicationId: "",
        uniqueTransactionId: "",
        srn: "",
        sjbtCode: req.userData.sjbtCode,
        retailerId: "",
        rewardFor: rewardFor.MANUAL,
        rewardTransactionType: transactionType,
        logs: remark,
        isManual: true,
      };

      const updatedRewardHistory = await this.userRewardModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: { ...rewardHistoryData },
        },
        {
          new: true,
        }
      );

      if (!updatedRewardHistory) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      /*get difference***/
      let oldAmount =
        oldRewardHistory.points * oldRewardHistory.rewardPointValue;

      let currentAmount =
        updatedRewardHistory.points * updatedRewardHistory.rewardPointValue;

      /****update refuund wallet */

      // let udateAmount =
      //   oldRewardHistory.rewardTransactionType == "CREDIT"
      //     ? updatedRewardHistory.rewardTransactionType == "CREDIT"
      //       ? rewardWalletFound.totalReward - oldAmount + currentAmount
      //       : rewardWalletFound.totalReward + oldAmount - currentAmount
      //     : updatedRewardHistory.rewardTransactionType == "DEBIT"
      //     ? rewardWalletFound.totalReward + oldAmount - currentAmount
      //     : rewardWalletFound.totalReward + oldAmount + currentAmount;

      let udateAmount;

      if (oldRewardHistory.rewardTransactionType === "CREDIT") {
        if (updatedRewardHistory.rewardTransactionType === "CREDIT") {
          udateAmount =
            rewardWalletFound.totalReward - oldAmount + currentAmount;
        } else {
          if (oldAmount == currentAmount) {
            udateAmount =
              rewardWalletFound.totalReward - oldAmount - currentAmount;
          } else {
            udateAmount =
              rewardWalletFound.totalReward - oldAmount - currentAmount;
          }
        }
      } else {
        if (updatedRewardHistory.rewardTransactionType === "DEBIT") {
          udateAmount =
            rewardWalletFound.totalReward + oldAmount - currentAmount;
        } else {
          udateAmount =
            rewardWalletFound.totalReward + oldAmount + currentAmount;
        }
      }

      const rewardWalletUpdated =
        await this.UserRewardWalletModel.findByIdAndUpdate(
          {
            _id: rewardWalletFound._id,
          },
          {
            $set: {
              totalReward: udateAmount,
            },
          },
          { new: true }
        );

      return res.status(200).send({
        message: "Data updated successfully.",
        status: true,
        data: rewardWalletUpdated,
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

      const rewardHistries = await this.userRewardModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!rewardHistries) {
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
        data: rewardHistries,
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

      /***get data */
      const rewardHistries = await this.userRewardModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!rewardHistries) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      const createRefundTransaction =
        await this.userRewardModel.findByIdAndUpdate(
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
}
