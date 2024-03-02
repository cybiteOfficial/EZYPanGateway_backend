import { Injectable } from '@nestjs/common';
import { CreateInitialNameDto } from './dto/create-initial-name.dto';
import { UpdateInitialNameDto } from './dto/update-initial-name.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  InitialName,
  InitialNameDocument,
} from './entities/initial-name.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';

@Injectable()
export class InitialNameService {
  [x: string]: any;
  constructor(
    @InjectModel(InitialName.name)
    private initialNameModel: Model<InitialNameDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all initial names
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const dataFound = await this.initialNameModel
        .find()
        .sort({ initials: 1 });

      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'INITIAL_NAME',
        'INITIAL_NAME_LIST',
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of initial names at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Initial names are as below.',
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
        'INITIAL_NAME',
        'INITIAL_NAME_LIST',
        req.userData?.Id || '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of initial names with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
