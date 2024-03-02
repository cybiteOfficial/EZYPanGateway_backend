import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PanApplication,
  PanDocument,
  status,
} from '../panapplications/entities/pan.entity';
import {
  ItrApplication,
  ItrApplicationDocument,
} from '../itr-application/entities/itr-application.entity';
import {
  DigitalSign,
  DigitalSignDocument,
} from '../digital-sign/entities/digital-sign.entity';
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from '../gumasta-application/entities/gumasta-application.entity';
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from '../msme-application/entities/msme-application.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';

@Injectable()
export class PendingAppService {
  [x: string]: any;
  constructor(
    @InjectModel(PanApplication.name) private panModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private dscModel: Model<DigitalSignDocument>,
    @InjectModel(GumastaApplication.name)
    private gumastaModel: Model<GumastaApplicationDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeModel: Model<MsmeApplicationDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}
  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      // if (!(requestedType === 'SUPER_ADMIN')) {
      //   throw new HttpException(
      //     'You dont have access to view pending applications.',
      //     HttpStatus.OK,
      //   );
      // }

      const query = {
        status: status.PENDING,
        isDeleted: false,
      };

      const panapplications = await this.panModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
      ]);

      const totalpanapplications = panapplications.length
        ? panapplications.length
        : 0;

      const itrapplications = await this.itrModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
      ]);

      const totalitrapplications = itrapplications.length
        ? itrapplications.length
        : 0;

      const dscapplications = await this.dscModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
      ]);

      const totaldscapplications = dscapplications.length
        ? dscapplications.length
        : 0;

      const msmeapplications = await this.msmeModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
      ]);

      const totalmsmeapplications = msmeapplications.length
        ? msmeapplications.length
        : 0;

      const gumastaapplications = await this.gumastaModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
      ]);

      const totalgumastaapplications = gumastaapplications.length
        ? gumastaapplications.length
        : 0;

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'PENDING_APPLICATIONS',
        'PENDING_APPLICATIONS_LIST',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of pending applications at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data found successfully.',
        status: true,
        data: {
          totalpanapplications: totalpanapplications,
          totalitrapplications: totalitrapplications,
          totaldscapplications: totaldscapplications,
          totalmsmeapplications: totalmsmeapplications,
          totalgumastaapplications: totalgumastaapplications,
        },
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'PENDING_APPLICATIONS',
        'PENDING_APPLICATIONS_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of pending applications with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
