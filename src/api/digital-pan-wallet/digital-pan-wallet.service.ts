/* eslint-disable prefer-const */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import { errorRes } from '../../helper/errorRes';
import { getUniqueTransactionId } from '../../helper/paymentGatewayHelper';
import {
  DigitalPanCardType,
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
} from '../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity';
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from './entities/digital-pan-wallet.entity';
import {
  DigitalPanApplication,
  DigitalPanDocument,
  Extra1,
  Type,
} from '../digital-pan/entities/digital-pan.entity';
import { AddLogFunction } from '../../helper/addLog';
import { paytmFunctions } from '../../helper/payment-gateway';
import {
  Transaction,
  TransactionDocument,
  paymentStatus,
  transactionFor,
} from '../transaction/entities/transaction.entity';
import { DigitalPanHelper } from '../digital-pan/digital-pan.helper';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class DigitalPanWalletServices {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanWallet.name)
    private DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(Transaction.name)
    private TransactionModel: Model<TransactionDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private DigitalPanTransactionsModel: Model<DigitalPanTransactionsDocument>,
    @InjectModel(DigitalPanApplication.name)
    private DigitalPanApplicationModel: Model<DigitalPanDocument>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    private readonly DigitalPanHelper: DigitalPanHelper,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly addLogFunction: AddLogFunction,
    private readonly paytmFunctions: paytmFunctions,
  ) {}

  //-------------------------get wallet balance----------------------------//

  async getWalletBalance(req, res) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let resToSend = {
        StatusCode: 0,
        Message: '',
        Transactions: {
          MainBalance: 0,
        },
      };

      let { RequestID, SessionID, RetailerID } = req.body;
      let digitalAppType = req.body.Extra1;
      let panype = req.body.Type;
      let userFound = await this.UserModel.findOne({
        _id: new mongoose.Types.ObjectId(RetailerID),
      });
      if (!userFound) {
        resToSend.StatusCode = 0;
        resToSend.Message = 'Retailer not Found.';
        resToSend.Transactions = null;
      }

      let getWallet = await this.DigitalPanWalletModel.findOne({
        userId: RetailerID,
      });
      if (!getWallet) {
        resToSend.StatusCode = 0;
        resToSend.Message = 'Wallet balance not found.';
        resToSend.Transactions = null;
      } else {
        resToSend.StatusCode = 1;
        resToSend.Message = 'Wallet balance found successfully.';
        resToSend.Transactions.MainBalance = getWallet.walletAmount;
      }

      let getAmount = await this.DigitalPanHelper.getAmount(
        digitalAppType,
        panype,
      );

      //total freezed  amount
      let freezeAmount = getWallet.freezeAmount + getAmount;

      let digitalPanWalletToBeUpdate =
        await this.DigitalPanWalletModel.findOneAndUpdate(
          { userId: RetailerID },
          {
            $set: {
              freezeAmount: freezeAmount,
              lock: true,
            },
          },
        );

      let checkApplicationExist = await this.DigitalPanApplicationModel.findOne(
        {
          $or: [
            { sessionId: req.body.SessionID, isDeleted: false },
            { txnId: req.body.RequestID, isDeleted: false },
          ],
        },
      );

      if (checkApplicationExist) {
        resToSend.StatusCode = 0;
        resToSend.Message =
          'Duplicate SessionID or txnId found. Please provide a unique value.';
        resToSend.Transactions = null;
      }

      let digitalPanApplicationData = {
        Extra1: digitalAppType,
        Type: panype,
        totalPrice: getAmount,
        txnId: RequestID,
        sessionId: SessionID,
        agentID: RetailerID,
      };

      /**create digital pan application */
      let digitalPanWalletTransactions =
        await this.DigitalPanApplicationModel.create({
          ...digitalPanApplicationData,
        });
      return res.status(200).send({ ...resToSend });
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------recharge wallet ----------------------------//
  async rechargeWallet(req, res) {
    try {
      let requestedAmt = req.body.requestedAmount;
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const { uniqueTransactionId, serialNumber } =
        await this.getUniqueTransactionId.generateId();
      const statusOfPayment =
        requestedAmt > 0 ? paymentStatus.PENDING : paymentStatus.SUCCESS;
      const redirectToPaymentGateway = requestedAmt > 0 ? true : false;
      let resDataToSend = {
        redirectToPaymentGateway,
        paymentGatewayData: {},
      };

      const transactionDataToBeAdd = {
        txnId: '',
        serialNumber: serialNumber,
        uniqueTransactionId: uniqueTransactionId,
        userId: requestedId,
        userType: requestedType,
        transactionFor: transactionFor.DIGITAL_PAN_WALLET_RECHARGE,
        date: moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss'),
        paymentStatus: statusOfPayment,
        totalAmount: requestedAmt,
        remark: `Wallet recharge by ${requestedType} ${req.userData.userName} on ${currentDate} `,
        reqData: [],
        resData: [],
      };

      if (redirectToPaymentGateway) {
        const paymentInitializeResponse: any =
          await this.paytmFunctions.initiatePayment({
            userId: requestedId,
            totalAmount: requestedAmt,
            email: req.userData.email,
            uniqueTransactionId,
            mobileNumber: req.userData.contactNumber,
          });

        if (
          !paymentInitializeResponse['status'] ||
          paymentInitializeResponse['data'] === null
        ) {
          throw new HttpException(
            'Something went wrong. Unable to open payment gateway. Please try again.',
            HttpStatus.OK,
          );
        }

        const { reqData, resData, orderId, txnToken, txnAmount, txnStatus } =
          paymentInitializeResponse['data'];
        transactionDataToBeAdd['reqData'] = reqData;
        transactionDataToBeAdd['resData'] = resData;
        transactionDataToBeAdd[
          'remark'
        ] = `Wallet recharged with amount ${requestedAmt} by ${requestedType} ${req.userData.userName} on ${currentDate} .`;
        transactionDataToBeAdd['uniqueTransactionId'] =
          resDataToSend.paymentGatewayData['orderId'] = orderId;
        resDataToSend.paymentGatewayData['token'] = txnToken;
        resDataToSend.paymentGatewayData['amount'] = txnAmount;
        resDataToSend.paymentGatewayData['tokenType'] = 'TXN_TOKEN';
      } else {
        resDataToSend.paymentGatewayData['orderId'] = uniqueTransactionId;
        resDataToSend.paymentGatewayData['token'] = null;
        resDataToSend.paymentGatewayData['amount'] = requestedAmt;
        resDataToSend.paymentGatewayData['tokenType'] = null;
      }

      // digital-pan-wallet to be update

      const transactionCreated = await new this.TransactionModel(
        transactionDataToBeAdd,
      ).save();

      return res.status(200).send({
        message: 'Recharge done.',
        status: true,
        data: resDataToSend,
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'DIGITAL_PAN_WALLET',
        'DIGITAL_PAN_WALLET_RECHARGE',
        req.userData.contactNumber,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${req.userData?.contactNumber || ''} ${
          req.userData?.contactNumber || ''
        } tried to recharge digital pan wallet with this ${
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
   * find refund wallet
   */
  //-------------------------------------------------------------------------

  async view(id, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let query = {
        userId: req.userData.Id,
      };

      const dataFound = await this.DigitalPanWalletModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
        {
          $addFields: {
            walletAmt: { $subtract: ['$walletAmount', '$freezeAmount'] },
          },
        },
        {
          $addFields: {
            user_id: { $toObjectId: '$userId' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $addFields: {
            userName: { $arrayElemAt: ['$user.name', 0] },
            email: { $arrayElemAt: ['$user.email', 0] },
            mobileNumber: { $arrayElemAt: ['$user.mobileNumber', 0] },
          },
        },
        {
          $unset: ['user', 'walletAmount'],
        },
      ]);

      if (!dataFound) {
        throw new HttpException('Data not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'DIGITAL_PAN_WALLET',
        'DIGITAL_PAN_WALLET_VIEW',
        id,
        true,
        200,
        `${requestedType} having contact number ${
          req.userData?.contactNumber || ''
        } viewed their wallet details.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Data found successfully.',
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
        'DIGITAL_PAN_WALLET',
        'DIGITAL_PAN_WALLET_VIEW',
        req.userData.Id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to view wallet details ${
          req.userData.Id
        } with this credentials at ${moment()
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
        'walletId',
        'userId',
        'applicationId',
        'applicationType',
        'DigitalPanCardType',
        'uniqueTransactionId',
        'sessionId',
        'freezeAmount',
        'transactionType',
        'debitedAmount',
        'creditedAmount',
        'createdByType',
        'createdById',
        'paymentStatus',
        'dateAndTime',
        'remark',
        'uuid',
        'isDeleted',
        'isActive',
        'createdAt',
        'updatedAt',
      ];

      const query = [];
      const filterQuery = [];
      let matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
      };

      if (req.route.path.includes('/web/')) {
        matchQuery = {
          $and: [{ isDeleted: false, userId: req.userData.Id }],
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
        //rangeFilterBy !== {} &&
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
      const numberFileds = ['walletAmount', 'debitedAmount', 'creditedAmount'];

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

      const additionaQuery = [
        {
          $match: {
            userId: { $exists: true, $ne: '' },
          },
        },
        {
          $addFields: {
            user_id: { $toObjectId: '$userId' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $addFields: {
            userName: { $arrayElemAt: ['$user.name', 0] },
            email: { $arrayElemAt: ['$user.email', 0] },
            mobileNumber: { $arrayElemAt: ['$user.mobileNumber', 0] },
          },
        },
        {
          $unset: 'user',
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;

      const dataFound = await this.DigitalPanTransactionsModel.aggregate(
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
        query.push({ $limit: limit });
      }

      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      const result = await this.DigitalPanTransactionsModel.aggregate(query);

      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'REFUND_WALLET_TRANSACTION',
          'REFUND_WALLET_TRANSACTION_FILTER_PAGINATION',
          '',
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          }filter data to view wallet transactions at ${currentDate}.`,
          'Data Found successfully.',
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
        'REFUND_WALLET_TRANSACTION',
        'REFUND_WALLET_TRANSACTION_FILTER_PAGINATION',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to filter data  with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
