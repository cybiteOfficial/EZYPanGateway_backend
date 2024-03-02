import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { State, StateDocument } from './entities/state.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';

@Injectable()
export class StateService {
  [x: string]: any;
  constructor(
    @InjectModel(State.name)
    private stateModel: Model<StateDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all States
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const dataFound = await this.stateModel.find().sort({ state: 1 });
      if (!dataFound.length) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'STATE',
        'STATE_LIST',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of states at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'States are as below.',
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
        'STATE',
        'STATE_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of states with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
