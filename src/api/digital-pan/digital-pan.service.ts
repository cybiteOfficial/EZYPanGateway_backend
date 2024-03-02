/* eslint-disable prefer-const */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DigitalPanApplication,
  DigitalPanDocument,
  Extra1,
  Type,
} from './entities/digital-pan.entity';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import { DigitalPanHelper } from './digital-pan.helper';
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from '../digital-pan-wallet/entities/digital-pan-wallet.entity';
import { WalletAmt } from '../digital-pan-wallet/digital-pan-wallet.helper';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, adminDocument } from '../admin/entities/admin.entity';

@Injectable()
export class DigitalPanServices {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanApplication.name)
    private DigitalPanModel: Model<DigitalPanDocument>,
    @InjectModel(DigitalPanWallet.name)
    private DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(Admin.name)
    private AdminModel: Model<adminDocument>,
    private readonly DigitalPanHelper: DigitalPanHelper,
    private readonly digitalPanWalletAmt: WalletAmt,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
  ) {}
  //-------------------------religare get token ----------------------------//

  async religareAuth(res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      let userId = req.userData.Id;
      let { Extra1, Type } = req.body;

      let getAmount = await this.DigitalPanHelper.getAmount(Extra1, Type);

      let digitalPanWalletModel = await this.DigitalPanWalletModel.findOne({
        userId: userId,
      });

      if (!digitalPanWalletModel) {
        //create digitalPan with zero amount
        digitalPanWalletModel = await this.digitalPanWalletAmt.createWallet(
          userId,
        );
      }

      //checkwallet wallet balance
      let walletRemainingAmount =
        digitalPanWalletModel.walletAmount - digitalPanWalletModel.freezeAmount;
      if (getAmount > walletRemainingAmount) {
        throw new HttpException('Insufficient Balance.', HttpStatus.OK);
      }

      let dataToBeInsert = {
        totalPrice: getAmount,
        appliedByType: req.userData.type,
        appliedById: req.userData.Id,
        appliedOnDate: currentDate,
        appliedByName: req.userData.name,
        appliedByNumber: req.userData.mobile,
        appliedAsType: req.userData.type,
      };

      const DigitalPanApplied = await new this.DigitalPanModel({
        ...dataToBeInsert,
        ...req.body,
      });

      let religateLoginToken = await this.DigitalPanHelper.religareAuth(userId);

      return res.status(200).send(religateLoginToken);
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'DSC_APPLICATION',
        'DSC_APPLICATION_ADD',
        req.userData.mobileNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${req.userData?.contactNumber || ''} ${
          req.userData?.mobileNumber || ''
        } tried to add DSC application with this ${req.userData.mobileNumber}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //------------------------digital-pan-status-check------------------------------//
  async statusCheck(res, req) {
    try {
      let { Token, PancardrefId } = req.body;
      let statusCheck = await this.DigitalPanHelper.statusCheck(
        req,
        Token,
        PancardrefId,
      );
      return res.status(200).send(statusCheck);
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'DIGITAL_PAN',
        'DIGITAL_PAN_STATUS_CHECK',
        req.userData.contactNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${req.userData?.contactNumber || ''} ${
          req.userData?.contactNumber || ''
        } tried to check  status of digital application with this ${
          req.userData.contactNumber
        }.`,
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
  async history(res, req) {
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
        'txnId',
        'mobileNumber',
        'applicationStatus',
        'status',
        'transactions',
        'agentID',
        'createdAt',
        'updatedAt',
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [{ agentID: req.userData.Id }, { isDeleted: false }],
      };

      if (req.route.path.includes('/admin/')) {
        matchQuery = {
          $and: [{ isDeleted: false }],
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
          dateFilter.dateFilterKey !== null &&
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
          dateFilter.start_date !== null &&
          dateFilter.start_date !== '' &&
          (dateFilter.end_date === undefined || dateFilter.end_date === '')
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== null &&
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
      const dataFound = await this.DigitalPanModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No application found.`, HttpStatus.OK);
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

      /**project query for admin role */
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.AdminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'DIGITAL_PAN_APPLICATIONS',
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK,
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields,
        );

        query.push({ $project: projectQuery });
      }

      const result = await this.DigitalPanModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'DIGITAL_PAN_APPLICATION',
          'DIGITAL_PAN_APPLICATION_FILTER_PAGINATION_WEB',
          '',
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          }filter data to view DSC application at ${currentDate}.`,
          'Application Found successfully.',
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: 'Application Found successfully.',
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`No application found.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'DIGITAL_PAN_APPLICATION',
        'DIGITAL_PAN_APPLICATION_FILTER_PAGINATION_WEB',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to filter data with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
