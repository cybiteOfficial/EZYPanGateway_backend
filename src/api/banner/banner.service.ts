import { CreateBannerDto } from './dto/create-banner.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import { Banner, BannerDocument } from './entities/banner.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import { keyValidationCheck } from '../../helper/keysValidationCheck';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, adminDocument } from '../admin/entities/admin.entity';

@Injectable()
export class BannerService {
  [x: string]: any;
  constructor(
    @InjectModel(Banner.name) private BannerModel: Model<BannerDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    private readonly userAuthHelper: userAuthHelper,
    private readonly addLogFunction: AddLogFunction,
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new Banner
   */
  //-------------------------------------------------------------------------

  async add(
    CreateBannerDto: CreateBannerDto,
    file: Express.Multer.File,
    res,
    req,
  ) {
    try {
      const { fileType, image, showOnMobile, showOnWeb, isActive } = req.body;

      if (file === undefined || file === null) {
        return res.status(200).send({
          status: false,
          message: 'Image not found.',
        });
      }
      const reqParams = [
        'fileType',
        'image',
        'showOnMobile',
        'showOnWeb',
        'isActive',
      ];
      const requiredKeys = ['fileType'];
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
      const path_array = file.path.split('public');
      file.path = `${process.env.LOCAL}public${
        path_array[path_array.length - 1]
      }`;

      const imagePath = file.path;
      const result = await new this.BannerModel({
        ...req.body,
        image: imagePath,
      }).save();

      if (!result) {
        throw new HttpException('Unable to add.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BANNER',
        'BANNER_ADD',
        result._id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } added banner at ${currentDate}.`,
        'Banner added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Banner added successfully.',
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
        'BANNER',
        'BANNER_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to add banner with this credentials at ${moment()
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
   * find all Banners
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

      const dataFound = await this.BannerModel.find({
        ...query,
      });
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BANNER',
        'BANNER_LIST',
        '',
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } checked lis of banner at ${currentDate}.`,
        'Banner found successfully.',
        req.socket.remoteAddress,
      );

      return res.status(200).send({
        message: 'Banner found successfully.',
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
        'BANNER',
        'BANNER_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `Banner list by admin with this credentials at ${moment()
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
   * find Banner
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

      let projectData = {};
      /***project query admin role */
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'BANNERS',
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
        projectData = projectQuery;
      }

      const bannerFound = await this.BannerModel.findOne(
        { ...query },
        projectData,
      );

      if (!bannerFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BANNER',
        'BANNER_VIEW',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } viewed banner ${id} at ${currentDate}.`,
        'Banner found successfully.',
        req.socket.remoteAddress,
      );

      return res.status(200).send({
        message: 'Data found successfully.',
        status: true,
        data: bannerFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'BANNER',
        'BANNER_VIEW',
        id,
        errData.resData.status,
        errData.statusCode,
        `Banner ${id} view by admin with this credentials at ${moment()
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
   * update Banner
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, file: Express.Multer.File, res, req) {
    try {
      const { fileType, image, showOnMobile, showOnWeb, isActive } = req.body;
      if (file === undefined || file === null) {
        return res.status(200).send({
          status: false,
          message: 'Image not found.',
        });
      }
      const reqParams = [
        'fileType',
        'image',
        'showOnMobile',
        'showOnWeb',
        'isActive',
      ];
      const requiredKeys = ['fileType'];
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

      const path_array = file.path.split('public');
      file.path = `${process.env.LOCAL}public${
        path_array[path_array.length - 1]
      }`;
      const imagePath = file.path;

      const bannerFound = await this.BannerModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!bannerFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const result = await this.BannerModel.findByIdAndUpdate(
        { _id: bannerFound._id },
        {
          $set: {
            image: imagePath,
            showOnMobile: showOnMobile,
            showOnWeb: showOnWeb,
            isActive: isActive,
          },
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
        'BANNER',
        'BANNER_UPDATE',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } updated banner ${id} at ${currentDate}.`,
        'Banner updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Banner updated successfully.',
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
        'BANNER',
        'BANNER_UPDATE',
        id,
        errData.resData.status,
        errData.statusCode,
        `Banner ${id} update by admin with this credentials at ${moment()
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
   * remove Banner
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const bannerFound = await this.BannerModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!bannerFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const dataUpdated = await this.BannerModel.findByIdAndUpdate(
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
        'BANNER',
        'BANNER_DELETE',
        id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } updated banner ${id} at ${currentDate}.`,
        'Banner deleted successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Banner deleted successfully.',
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
        'BANNER',
        'BANNER_DELETE',
        id,
        errData.resData.status,
        errData.statusCode,
        `Banner ${id} delete by admin with this credentials at ${moment()
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
   * change status of Banner
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const bannerFound = await this.BannerModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!bannerFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = bannerFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.BannerModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isActive: activeStatus } },
        { new: true },
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData.Id,
          'BANNER',
          'BANNER_STATUS',
          id,
          true,
          200,
          `${req.userData?.type || ''} ${
            req.userData?.contactNumber || ''
          } changed status to ${statusValue} at ${currentDate}.`,
          `Banner status changed to ${statusValue}`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Banner status changed to ${statusValue} successfully.`,
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
        'BANNER',
        'BANNER_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `Banner ${id} status changed by admin with this credentials at ${moment()
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
      const userType = req.userData.type;
      const module_group = 'BANNER';

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
        'image',
        'showOnMobile',
        'showOnWeb',
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
      const dataFound = await this.BannerModel.aggregate(countQuery);
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

      /***project query admin role */
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'BANNERS',
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

      const result = await this.BannerModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData?.Id || '',
          'BANNER',
          'BANNER_FILTER_PAGINATION',
          req.userData?.Id || '',
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } filter data for view banner at ${currentDate}.`,
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
        'BANNER',
        'BANNER_FILTER_PAGINATION',
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

  //-------------------------------------------------------------------------
  /***
   * change show on web of banner
   */
  //-------------------------------------------------------------------------

  async changeShowOnWeb(id: string, res, req) {
    try {
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const bannerFound = await this.BannerModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        isActive: true,
      });

      if (!bannerFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = bannerFound.showOnWeb === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVATED' : 'DEACTIVATED';

      const statusChanged = await this.BannerModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { showOnWeb: activeStatus } },
        { new: true },
      );

      if (statusChanged.showOnWeb === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || '',
          req.userData.Id,
          'BANNER',
          'BANNER_LIST_WITH_FILTER',
          id,
          true,
          200,
          `${
            req.userData?.type || ''
          } ${statusValue} banner on web at ${currentDate}.`,
          `Banner is ${statusValue} on web successfully.`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Banner is ${statusValue} on web successfully.`,
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
        'BANNER',
        'BANNER_LIST_WITH_FILTER',
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        }  change show on web status of banner ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
