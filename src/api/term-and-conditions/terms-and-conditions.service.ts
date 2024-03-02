import { CreateTermsAndConditions } from './dto/create-terms-and-conditions.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  TermsAndConditions,
  TermsAndConditionsDocument,
} from './entities/terms-and-conditions.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { keyValidationCheck } from '../../helper/keysValidationCheck';

@Injectable()
export class TermsAndConditionsService {
  [x: string]: any;
  constructor(
    @InjectModel(TermsAndConditions.name)
    private TermsAndConditionsModel: Model<TermsAndConditionsDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all TermsAndConditionss
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
        };
      }

      const dataFound = await this.TermsAndConditionsModel.find({
        ...query,
      });
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_LIST',
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of terms and conditions at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data found successfully.',
        status: true,
        data: dataFound[0],
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_LIST',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of terms and conditions with this credentials at ${moment()
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
   * find all TermsAndConditions for web
   */
  //-------------------------------------------------------------------------

  async listForWeb(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const query: any = {
        isDeleted: false,
        isActive: true,
      };

      const dataFound = await this.TermsAndConditionsModel.find({
        ...query,
      });
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_LIST_FOR_WEB',
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of terms and conditions on web at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data found successfully.',
        status: true,
        data: dataFound[0],
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_LIST_FOR_WEB',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of terms and conditions on web with this credentials at ${moment()
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
   * update TermsAndConditions
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const { description } = req.body;

      const reqParams = ['description'];
      const requiredKeys = ['description'];

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

      const TermsAndConditionsFound =
        await this.TermsAndConditionsModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
          isActive: true,
        });

      if (!TermsAndConditionsFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }

      const result = await this.TermsAndConditionsModel.findByIdAndUpdate(
        { _id: TermsAndConditionsFound._id },
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
        requestedType,
        requestedId,
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_UPDATE',
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } updated terms and conditions ${id} at ${currentDate}.`,
        'Terms and conditions updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data updated successfully.',
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
        'TERMS_AND_CONDITIONS',
        'TERMS_AND_CONDITIONS_UPDATE',
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to update terms and conditions ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
