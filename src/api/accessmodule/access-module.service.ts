/* eslint-disable prettier/prettier */
import {
  AccessModule,
  AccessModuleDocument,
} from './entities/access-module.entity';
import { UpdateAccessModuleDto } from './dto/update-access-module.dto';
import { CreateAccessModuleDto } from './dto/create-access-module.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { webModules } from '../../helper/notRequiredAccessRoutes';

@Injectable()
export class AccessModuleService {
  [x: string]: any;
  constructor(
    @InjectModel(AccessModule.name)
    private AccessModuleModel: Model<AccessModuleDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //------------------------------------------------------------------------

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  async add(CreateAccessModuleDto: CreateAccessModuleDto, res, req) {
    try {
      const { moduleName, moduleGroup, method, url } = CreateAccessModuleDto;
      CreateAccessModuleDto.moduleGroup = moduleGroup.toUpperCase();
      CreateAccessModuleDto.moduleName = moduleName.toUpperCase();
      CreateAccessModuleDto.method = method.toUpperCase();
      CreateAccessModuleDto.url = url.toLowerCase();

      const dataExist = await this.AccessModuleModel.find({
        moduleName,
        moduleGroup,
        method,
        url,
      });
      if (dataExist.length) {
        throw new HttpException(
          'Another module already exist with the same details.',
          HttpStatus.OK,
        );
      }
      const result = await new this.AccessModuleModel(
        CreateAccessModuleDto,
      ).save();

      if (!result) {
        throw new HttpException('Unable to add access module.', HttpStatus.OK);
      }
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ACCESS_MODULE',
        'ACCESS_MODULE_ADD',
        result._id,
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } added access module at ${currentDate}.`,
        'Access module added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Access module added successfully.',
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
        'ACCESS_MODULE',
        'ACCESS_MODULE_ADD',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `Admin tried to add access module with this credentials at ${moment()
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
   * update user
   */
  //-------------------------------------------------------------------------

  async update_by_id(res, req) {
    try {
      let moduleArray = await webModules();
      const moduleGroups = moduleArray.map((module) => module.moduleName);

      moduleGroups.forEach(async (groupName) => {
        const webActions = moduleArray.find(
          (module) => module.moduleName === groupName,
        ).webActions;

        // const accessModuleData = await this.AccessModuleModel.find({
        //   moduleName: 'DEFAULT_LIST',
        // });

        const accessModuleData = await this.AccessModuleModel.find({
          moduleGroup: { $nin: moduleGroups },
        });

        // const accessModuleData = await this.AccessModuleModel.find({
        //   moduleName: { $in: webActions },
        //   moduleGroup: groupName,
        // });

        // const accessModuleData = await this.AccessModuleModel.find({
        //   moduleName: { $nin: webActions },
        //   moduleGroup: groupName,
        // });

        // accessModuleData.forEach(async (document) => {
        //   await this.AccessModuleModel.updateOne(
        //     {
        //       _id: document._id,
        //     },
        //     {
        //       $set: {
        //         isadminApi: false,
        //         iswebApi: true,
        //       },
        //     },
        //     { new: true },
        //   );
        // });
      });

      // const documents = await this.AccessModuleModel.find();
      // documents.forEach(async (document) => {
      //   await this.AccessModuleModel.updateOne(
      //     {
      //       _id: document._id,
      //     },
      //     {
      //       $set: {
      //         isadminApi: true,
      //       },
      //     },
      //     { new: true },
      //   );
      // });
      // return res.status(200).send({
      //   message: 'Access module updated successfully.',
      //   status: true,
      //   data: null,
      //   code: 'OK',
      //   issue: null,
      // });

      // const currentDate = moment()
      //   .utcOffset('+05:30')
      //   .format('YYYY-MM-DD HH:mm:ss');

      // this.addLogFunction.logAdd(
      //   req,
      //   req.userData?.type || '',
      //   req.userData?.Id || '',
      //   'ACCESS_MODULE',
      //   'ACCESS_MODULE_UPDATE',
      //   '',
      //   true,
      //   200,
      //   `${req.userData?.type || ''} ${
      //     req.userData?.contactNumber || ''
      //   } update data at ${currentDate}.`,
      //   'Access module updated successfully.',
      //   req.socket.remoteAddress,
      // );
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ACCESS_MODULE',
        'ACCESS_MODULE_UPDATE',
        '',
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to udpdate access module data with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  async getAccessModules(req, res) {
    try {
      const requestedId = req.userData.Id;

      const getAccessModules = await this.AccessModuleModel.aggregate([
        {
          $match: {
            isadminApi: true,
            skip: false,
          },
        },
        {
          $group: {
            _id: '$moduleGroup',
            actions: { $push: '$moduleName' },
          },
        },
        {
          $addFields: {
            moduleGroup: '$_id',
          },
        },

        {
          $lookup: {
            from: 'allaccessfields',
            localField: 'moduleGroup',
            foreignField: 'moduleGroup',
            as: 'accessfields',
            pipeline: [
              {
                $project: {
                  fields: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            fields: { $arrayElemAt: ['$accessfields.fields', 0] },
          },
        },
        {
          $unset: ['accessfields', '_id'],
        },
      ]);

      // let modules = webModules();

      // const result = getAccessModules
      //   .map((accessmodule) => {
      //     const matchingModule = modules.find(
      //       (module) => module.moduleName === accessmodule.moduleGroup,
      //     );

      //     if (matchingModule) {
      //       const remainingActions = accessmodule.actions.filter(
      //         (action) => !matchingModule.webActions.includes(action),
      //       );

      //       if (remainingActions.length === 0) {
      //         return null;
      //       }

      //       return { ...accessmodule, actions: remainingActions };
      //     }

      //     return accessmodule;
      //   })
      //   .filter((accessmodule) => accessmodule !== null);

      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ACCESS_MODULE',
        'ACCESS_MODULE_LIST',
        req.userData?.Id || '',
        true,
        200,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } added access module at ${currentDate}.`,
        'Access module found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Access module found successfully.',
        status: true,
        data: getAccessModules,
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ACCESS_MODULE',
        'ACCESS_MODULE_LIST',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `Admin tried to get access module with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
