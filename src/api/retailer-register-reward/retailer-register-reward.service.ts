import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  RetailerRegisterReward,
  RetailerRegisterRewardDocument,
} from './entities/retailer-register-reward.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import {
  RewardHistory,
  RewardHistoryDocument,
} from '../rewardHistory/entities/rewardHistory.entity';
import {
  RetailerRewardUpdateHistory,
  RetailerRewardUpdateHistoryDocument,
} from '../retailer-reward-update-history/entities/retailer-reward-update-history.entity';

@Injectable()
export class RetailerRegisterRewardService {
  [x: string]: any;
  constructor(
    @InjectModel(RetailerRegisterReward.name)
    private retailerRegisterRewardModel: Model<RetailerRegisterRewardDocument>,
    @InjectModel(RewardHistory.name)
    private userRewardModel: Model<RewardHistoryDocument>,
    @InjectModel(RetailerRewardUpdateHistory.name)
    private RetailerRewardUpdateHistoryModel: Model<RetailerRewardUpdateHistoryDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new reward point
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const result = await new this.retailerRegisterRewardModel({
        ...req.body,
      }).save();

      if (!result) {
        throw new HttpException('Unable to add reward point.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_ADD',
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } added reward point for retailer register at ${currentDate}.`,
        'Reward point added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data added successfully.',
        status: true,
        data: result,
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${req.userData?.contactNumber || ''} ${
          req.userData?.Id || ''
        } tried to add reward point with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * update reward point
   */
  //-------------------------------------------------------------------------

  async update_by_id(id, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const rewardFound = await this.retailerRegisterRewardModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      if (!rewardFound) {
        throw new HttpException(
          'Reward point for retailer register not found.',
          HttpStatus.OK,
        );
      }

      const result = await this.retailerRegisterRewardModel.findByIdAndUpdate(
        {
          _id: rewardFound._id,
        },
        {
          $set: {
            ...req.body,
          },
        },
        { new: true },
      );

      if (!result) {
        throw new HttpException(
          'Unable to update reward point for retailer register.',
          HttpStatus.OK,
        );
      }

      const updatedHistoryData = {
        updatedById: req.userData.Id,
        updatedRetailerRegisterRewardPoint: result.retailerRegisterRewardPoint,
        previousRetailerRewardUpdateHistoryPoint:
          rewardFound.retailerRegisterRewardPoint,
      };

      const updateHistory = await new this.RetailerRewardUpdateHistoryModel({
        ...updatedHistoryData,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_UPDATE',
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } updated reward point for retailer register at ${currentDate}.`,
        'Reward point updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Reward point updated successfully.',
        status: true,
        data: result,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_UPDATE',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to update reward point for retailer register with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
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
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const rewardFound = await this.retailerRegisterRewardModel.find();

      if (!rewardFound.length) {
        throw new HttpException(
          'Reward point for retailer register not found.',
          HttpStatus.OK,
        );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_LIST',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of reward point for retailer register at ${currentDate}.`,
        'Reward point found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Reward point found successfully.',
        status: true,
        data: rewardFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'RETAILER_REGISTER_REWARD_POINT',
        'RETAILER_REGISTER_REWARD_POINT_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to checked list of reward point for retailer register with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
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
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
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
        req.body.isPaginationRequired === 'false' ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        '_id',
        'updatedById',
        'updatedRetailerRegisterRewardPoint',
        'previousRetailerRegisterRewardPoint',
        'isDeleted',
        'isActive',
        'createdAt',
        'updatedAt',
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
        orderBy === '' ||
        typeof orderBy !== 'string'
      ) {
        orderBy = 'createdAt';
      }

      if (
        orderByValue === undefined ||
        orderByValue === '' ||
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
          if (searchIn[key] === '') {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK,
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK,
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
        searchValue !== '' &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: 'i' };
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
        typeof rangeFilterBy === 'object'
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== '' &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === 'string'
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== '' &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== '' &&
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
      const invalidData = ['null', null, undefined, 'undefined', ''];
      const booleanFields = ['isActive', 'isDeleted'];
      const numberFileds = ['retailerRegisterRewardPoint'];

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
              } else if (filterBy[each].value !== '') {
                if (
                  typeof filterBy[each].value === 'string' &&
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
                  typeof filterBy[each].value === 'boolean' ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === 'true'
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

      const allowedDateFiletrKeys = ['createdAt', 'updatedAt'];
      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== ''
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK,
            );
          }
        } else {
          dateFilter.dateFilterKey = 'createdAt';
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== '' &&
          (dateFilter.end_date === undefined || dateFilter.end_date === '')
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== '' &&
          (dateFilter.start_date === undefined || dateFilter.start_date === '')
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (dateFilter.start_date !== '' && dateFilter.end_date !== '') {
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
                        to: 'date',
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
                        to: 'date',
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
      const dataFound = await this.RetailerRewardUpdateHistoryModel.aggregate(
        countQuery,
      );
      if (dataFound.length === 0) {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === '' ? totalData : limit));
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

      const result = await this.RetailerRewardUpdateHistoryModel.aggregate(
        query,
      );
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'RETAILER_REGISTER_REWARD_POINT_LOG',
          'RETAILER_REGISTER_REWARD_POINT_LOG_FILTER_PAGINATION',
          '',
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          }filter data to view reward point for retailer register logs at ${currentDate}.`,
          'Data Found successfully.',
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: 'Data Found successfully.',
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'RETAILER_REGISTER_REWARD_POINT_LOG',
        'RETAILER_REGISTER_REWARD_POINT_LOG_FILTER_PAGINATION',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to filter data of reward point for retailer register with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
