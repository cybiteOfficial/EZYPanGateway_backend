import { CreateCityCodeDto } from './dto/create-city-code.dto';
import { UpdateCityCodeDto } from './dto/update-city-code.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CityCode, CityCodeDocument } from './entities/city-code.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, adminDocument } from '../admin/entities/admin.entity';

@Injectable()
export class CityCodeService {
  [x: string]: any;
  constructor(
    @InjectModel(CityCode.name)
    private CityCodeModel: Model<CityCodeDocument>,
    @InjectModel(Admin.name)
    private adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new CityCode
   */
  //-------------------------------------------------------------------------

  async add(CreateCityCodeDto: CreateCityCodeDto, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const checkDataExist = await this.CityCodeModel.find({
        city: CreateCityCodeDto.city,
        areaCode: CreateCityCodeDto.areaCode,
        aoType: CreateCityCodeDto.aoType,
        rangeCode: CreateCityCodeDto.rangeCode,
        aoNo: CreateCityCodeDto.aoNo,
      });
      if (checkDataExist.length) {
        throw new HttpException('Data already exist.', HttpStatus.OK);
      }
      const result = await new this.CityCodeModel(CreateCityCodeDto).save();

      if (!result) {
        throw new HttpException('Unable to add.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'AO_CODE',
        'AO_CODE_ADD',
        result._id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } added AO codes at ${currentDate}.`,
        'AO codes added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'AO codes added successfully.',
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
        'AO_CODE',
        'AO_CODE_ADD',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        }  tried to add AO codes with this credentials at ${moment()
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
   * find all CityCodes
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let projectQuery = {};

      /**project query for admin role */

      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'CITY_CODES',
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK,
          );
        }

        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const dataFound = await this.CityCodeModel.find(
        { isDeleted: false },
        projectQuery,
      );
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'AO_CODE',
        'AO_CODE_LIST',
        req.userData?.Id || '',
        true,
        200,
        `${
          req.userData?.type || 'user'
        } check list of AO codes at ${currentDate}`,
        'AO codes found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'AO codes found successfully.',
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
        'AO_CODE',
        'AO_CODE_LIST',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || 'user'} ${
          req.userData?.Id || 'user'
        }check list of AO codes`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * find CityCode
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let projectQuery = {};

      /**project query for admin role */
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'CITY_CODES',
        );

        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK,
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const CityCodeFound = await this.CityCodeModel.findOne(
        {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
        projectQuery,
      );
      if (!CityCodeFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'AO_CODE',
        'AO_CODE_VIEW',
        id,
        true,
        200,
        `${req.userData?.type || 'user'} ${
          req.userData?.Id || 'user'
        }view ${id} AO code at ${currentDate}.`,
        'AO code found successfully.!',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'AO code found successfully.',
        status: true,
        data: CityCodeFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'AO_CODE',
        'AO_CODE_VIEW',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || 'user'} view ${id} AO code.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * update CityCode
   */
  //-------------------------------------------------------------------------

  async update_by_id(
    id: string,
    updateCityCodeDto: UpdateCityCodeDto,
    res,
    req,
  ) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const CityCodeFound = await this.CityCodeModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!CityCodeFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const result = await this.CityCodeModel.findByIdAndUpdate(
        { _id: CityCodeFound._id },
        { $set: { ...req.body } },
        { new: true },
      );

      if (!result) {
        throw new HttpException('Could not update data.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'AO_CODE',
        'AO_CODE_UPDATE',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } update ${id} AO code at ${currentDate}.`,
        'AO code updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'AO code updated successfully.',
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
        'AO_CODE',
        'AO_CODE_UPDATE',
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } update ${id} AO code with this credentials at ${moment()
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
   * remove ContactInfo
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const aoCodes = await this.CityCodeModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!aoCodes) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const dataUpdated = await this.CityCodeModel.findByIdAndUpdate(
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
        'CITY_CODES',
        'CITY_CODES_DELETE',
        id,
        true,
        200,
        `${
          req.userData?.type || ''
        } deleted city code ${id} at ${currentDate}.`,
        `City codes deleted successfully.`,
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'AO code deleted successfully.',
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
        'CITY_CODES',
        'CITY_CODES_DELETE',
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to delete contact information with this credentials at ${moment()
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
        'city',
        'areaCode',
        'aoType',
        'rangeCode',
        'aoNo',
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
      const booleanFields = ['isActive', 'isDeleted'];
      const numberFileds = ['rangeCode', 'aoNo'];

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
      const dataFound = await this.CityCodeModel.aggregate(countQuery);
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

      /**project query for admin role */
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'CITY_CODES',
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
      const result = await this.CityCodeModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData.Id,
          'AO_CODE',
          'AO_CODE_FILTER_PAGINATION',
          req.userData?.Id || '',
          true,
          200,
          `${req.userData?.type || ''} ${
            req.userData?.contactNumber || ''
          } filter data for view AO code at ${currentDate}.`,
          `Data Found successfully.`,
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
        'AO_CODE',
        'AO_CODE_FILTER_PAGINATION',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } filter data for view AO code with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
