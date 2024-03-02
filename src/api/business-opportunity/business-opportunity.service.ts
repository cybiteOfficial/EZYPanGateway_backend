import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import {
  BusinessOpportunity,
  BusinessOpportunityDocument,
} from './entities/business-opportunity.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import { keyValidationCheck } from '../../helper/keysValidationCheck';

@Injectable()
export class BusinessOpportunityService {
  [x: string]: any;
  constructor(
    @InjectModel(BusinessOpportunity.name)
    private BusinessOpportunityModel: Model<BusinessOpportunityDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const { serviceName, commission, retailerReward } = req.body;
      const reqParams = ['serviceName', 'commission', 'retailerReward'];
      const requiredKeys = ['serviceName', 'commission', 'retailerReward'];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys,
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: 'BAD_REQUEST',
          issue: 'REQUEST_BODY_VALIDATION_FAILED',
          data: null,
        });
      }

      const result = await new this.BusinessOpportunityModel({
        ...req.body,
      }).save();

      if (!result) {
        throw new HttpException('Unable to add.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_ADD',
        result._id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } added business opportunity at ${currentDate}.`,
        'Business Opportunity added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Business Opportunity added successfully.',
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
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to add business opportunity with this credentials at ${moment()
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
   * find all BusinessOpportunitys
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let query: any = {
        isDeleted: false,
      };

      if (!req.route.path.includes('/admin/')) {
        query = {
          isActive: true,
          isDeleted: false,
          showOnWeb: true,
        };
      }

      const dataFound = await this.BusinessOpportunityModel.find({
        ...query,
      });
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_LIST',
        '',
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } checked lis of business opportunity at ${currentDate}.`,
        'Business Opportunity found successfully.',
        req.socket.remoteAddress,
      );

      return res.status(200).send({
        message: 'Business Opportunity found successfully.',
        status: true,
        data: dataFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `BusinessOpportunity list by admin with this credentials at ${moment()
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
   * find BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      let query: any = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      };

      if (!req.route.path.includes('/admin/')) {
        query = {
          _id: new mongoose.Types.ObjectId(id),
          isActive: true,
          isDeleted: false,
        };
      }
      const businessOpportunityFound =
        await this.BusinessOpportunityModel.findOne({
          ...query,
        });
      if (!businessOpportunityFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_VIEW',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } viewed business opportunity ${id} at ${currentDate}.`,
        'Business Opportunity found successfully.',
        req.socket.remoteAddress,
      );

      return res.status(200).send({
        message: 'Data found successfully.',
        status: true,
        data: businessOpportunityFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_VIEW',
        id,
        errData.resData.status,
        errData.statusCode,
        `BusinessOpportunity ${id} view by admin with this credentials at ${moment()
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
   * update BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, res, req) {
    try {
      const { serviceName, commission, retailerReward } = req.body;
      const reqParams = ['serviceName', 'commission', 'retailerReward'];
      const requiredKeys = ['serviceName', 'commission', 'retailerReward'];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys,
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: 'BAD_REQUEST',
          issue: 'REQUEST_BODY_VALIDATION_FAILED',
          data: null,
        });
      }

      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const businessOpportunityFound =
        await this.BusinessOpportunityModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!businessOpportunityFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const result = await this.BusinessOpportunityModel.findByIdAndUpdate(
        { _id: businessOpportunityFound._id },
        {
          $set: { ...req.body },
        },
        { new: true },
      );

      if (!result) {
        throw new HttpException('Could not update data.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_UPDATE',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } updated business opportunity ${id} at ${currentDate}.`,
        'Business Opportunity updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Business Opportunity updated successfully.',
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
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_UPDATE',
        id,
        errData.resData.status,
        errData.statusCode,
        `BusinessOpportunity ${id} update by admin with this credentials at ${moment()
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
   * remove BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const businessOpportunityFound =
        await this.BusinessOpportunityModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!businessOpportunityFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const dataUpdated = await this.BusinessOpportunityModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { new: true },
      );

      if (!dataUpdated) {
        throw new HttpException('Could not delete data.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_DELETE',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } updated business opportunity ${id} at ${currentDate}.`,
        'Business Opportunity deleted successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Business Opportunity deleted successfully.',
        status: true,
        data: null,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_DELETE',
        id,
        errData.resData.status,
        errData.statusCode,
        `BusinessOpportunity ${id} delete by admin with this credentials at ${moment()
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
   * change status of BusinessOpportunity
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const businessOpportunityFound =
        await this.BusinessOpportunityModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        });

      if (!businessOpportunityFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus =
        businessOpportunityFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged =
        await this.BusinessOpportunityModel.findByIdAndUpdate(
          { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
          { $set: { isActive: activeStatus } },
          { new: true },
        );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData.Id,
          'BUSINESS_OPPORTUNITY',
          'BUSINESS_OPPORTUNITY_STATUS',
          id,
          true,
          200,
          `${req.userData?.type || ''} ${
            req.userData?.contactNumber || ''
          } changed status to ${statusValue} at ${currentDate}.`,
          `Business Opportunity status changed to ${statusValue}`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Status changed to ${statusValue} successfully.`,
          status: true,
          data: null,
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `BusinessOpportunity ${id} status changed by admin with this credentials at ${moment()
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
  async allWithFilters(req, res) {
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
        'serviceName',
        'commission',
        'retailerReward',
        'isDeleted',
        'isActive',
        'createdAt',
        'updatedAt',
      ];

      const query = [];
      const filterQuery = [];
      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
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
      const booleanFields = [
        'isActive',
        'isDeleted',
        'showOnWeb',
        'showOnMobile',
      ];
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
      const dataFound = await this.BusinessOpportunityModel.aggregate(
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
        // query.push({ $project: projectData });
        query.push({ $limit: limit });
      }

      const result = await this.BusinessOpportunityModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData?.Id || '',
          'BUSINESS_OPPORTUNITY',
          'BUSINESS_OPPORTUNITY_FILTER_PAGINATION',
          req.userData?.Id || '',
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } filter data for view business opportunity at ${currentDate}.`,
          'Data found successfully.',
          req.userData.Id,
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
        'BUSINESS_OPPORTUNITY',
        'BUSINESS_OPPORTUNITY_FILTER_PAGINATION',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `USER ${
          req.body.userName
        } tried to list with filter with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.userData.Id,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
