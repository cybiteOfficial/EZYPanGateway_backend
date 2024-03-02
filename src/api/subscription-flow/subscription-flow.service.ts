import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SubscriptionFlow,
  SubscriptionFlowDocument,
} from './entities/subscription-flow.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { keyValidationCheck } from '../../helper/keysValidationCheck';

@Injectable()
export class SubscriptionFlowService {
  [x: string]: any;
  constructor(
    @InjectModel(SubscriptionFlow.name)
    private SubscriptionFlowModel: Model<SubscriptionFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new SubscriptionFlow
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        userId,
        paymentId,
        amount,
        subscriptionType,
        subscriptionExpiry,
      } = req.body;

      const reqParams = [
        'userId',
        'paymentId',
        'amount',
        'subscriptionType',
        'subscriptionExpiry',
      ];

      const requiredKeys = [
        'userId',
        'paymentId',
        'amount',
        'subscriptionType',
        'subscriptionExpiry',
      ];

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

      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const subscriptionExpiryFormat =
        moment(subscriptionExpiry).format('YYYY-MM-DD');

      if (!subscriptionExpiryFormat) {
        throw new HttpException(
          'Invalid subscription expiry date format. Please provide a date in the format of YYYY-MM-DD.',
          HttpStatus.OK,
        );
      }

      const addSubscription = await new this.SubscriptionFlowModel({
        ...req.body,
      }).save();

      if (!addSubscription) {
        throw new HttpException(
          'Unable to add subscription plan.',
          HttpStatus.OK,
        );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'SUBSCRIPTION_FLOW',
        'SUBSCRIPTION_FLOW_ADD',
        addSubscription._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } added subscription at ${currentDate}.`,
        'Subscription Flow added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Subscription flow added successfully.',
        status: true,
        data: addSubscription,
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'SUBSCRIPTION_FLOW',
        'SUBSCRIPTION_FLOW_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to add subscription with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
