/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from '../../helper/basicValidation';
import { HttpException, HttpStatus } from '@nestjs/common';
import { keyValidationCheck } from '../../helper/keysValidationCheck';
import { urlFields } from '../panapplications/entities/pan.entity';
import { Role, User, UserDocument } from '../user/entities/user.entity';
import {
  RefundWallet,
  RefundWalletDocument,
} from '../refund-wallet/entities/refund-wallet.entity';
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from '../userRewardWallet/entities/userRewardWallet.entity';
import {
  PriceConfig,
  PriceConfigDocument,
  serviceType,
} from '../price-config/entities/price-config.entity';
import { errorRes } from '../../helper/errorRes';

export class msmeCartData {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>,
  ) {}

  async getBasePrice(userType) {
    const basePriceData = await this.PriceConfigModel.findOne({
      serviceType: serviceType.MSME,
    });
    const configBasePrice =
      userType === Role.GUEST
        ? basePriceData.guestBaseprice
        : basePriceData.price;
    const configConvinienceCharges =
      userType === Role.GUEST
        ? basePriceData.guestConvenienceprice
        : basePriceData.convenienceprice;
    return { configBasePrice, configConvinienceCharges };
  }

  async getAmount(userType: string) {
    try {
      const { configBasePrice, configConvinienceCharges } =
        await this.getBasePrice(userType);

      const totalAmount = configBasePrice;

      return {
        status: true,
        data: {
          totalAmount: totalAmount,
          convinienceCharges: configConvinienceCharges,
          basePrice: configBasePrice,
        },
      };
    } catch (err) {
      return {
        status: true,
        data: {
          totalAmount: 0,
          convinienceCharges: 0,
          basePrice: 0,
        },
      };
    }
  }

  async getRefundAmount(userId) {
    try {
      const refundWalletData = await this.RefundWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });
      if (refundWalletData) {
        return {
          status: true,
          data: {
            refundAmount:
              refundWalletData.walletAmount - refundWalletData.freezeAmount,
          },
        };
      }
      return {
        status: false,
        data: { refundAmount: 0 },
      };
    } catch (err) {
      const errData = errorRes(err);

      return {
        status: false,
        data: { refundAmount: 0 },
      };
    }
  }

  async getRewardAmount(userId: any) {
    try {
      const rewardWalletData: any = await this.UserRewardWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });
      if (rewardWalletData) {
        return {
          status: true,
          data: { rewardAmount: rewardWalletData.totalReward },
        };
      }
      return {
        status: false,
        data: { rewardAmount: 0 },
      };
    } catch (err) {
      const errData = errorRes(err);

      return {
        status: false,
        data: { rewardAmount: 0 },
      };
    }
  }
  async msmeCartItems(msmeCartItems, req, res) {
    try {
      const dataToBeInsert = [];
      for (const eachItem in msmeCartItems) {
        let {
          propritorName,
          firmName,
          srn,
          email,
          mobileNumber,
          adhaarNumber,
          address,
          photoUrl,
          adhaarCardPhotoUrl,
          panCardPhotoUrl,
          otherDocuments,
          appliedBy,
          appliedAs,
          txnId,
          payementDetails,
          appliedFrom,
          version,
          status,
          assignedTo,
          assignedBy,
          IsAgreedToTermsAndConditions,
        } = msmeCartItems[eachItem];

        /**check mobile number is valid or not*/
        if (!isMobileValid(mobileNumber)) {
          throw new HttpException(
            'Mobile number must be a valid number.',
            HttpStatus.OK,
          );
        }

        /**check email is valid or not */
        if (email && email !== '') {
          if (!isEmailValid(email)) {
            throw new HttpException('Invalid email Id.', HttpStatus.OK);
          }
        }

        /**check adhar number is valid or not */
        if (adhaarNumber && isAadharValid(adhaarNumber) === false) {
          throw new HttpException(
            'Aadhar number must be valid number.',
            HttpStatus.OK,
          );
        }

        if (photoUrl && isvalidUrl(photoUrl) === false) {
          /**check passportPhotoUrl is valid or not */
          throw new HttpException(
            'Passoport photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check panCardPhotoUrl is valid or not */
        if (panCardPhotoUrl && isvalidUrl(panCardPhotoUrl) === false) {
          throw new HttpException(
            'MSME form front photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check adhaarCardPhotoUrl is valid or not */
        if (adhaarCardPhotoUrl && isvalidUrl(adhaarCardPhotoUrl) === false) {
          throw new HttpException(
            'Adhaar card photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        if (otherDocuments && otherDocuments !== '') {
          otherDocuments = JSON.parse(JSON.stringify(otherDocuments));
          if (!Array.isArray(otherDocuments)) {
            throw new HttpException(
              'Other documents must be array.',
              HttpStatus.OK,
            );
          }
          if (otherDocuments.length) {
            for (const each in otherDocuments) {
              if (otherDocuments[each]) {
                const { title, imageUrl } = otherDocuments[each];
                if (title === undefined || title === null || title === '') {
                  throw new HttpException(
                    'title must not be empty.',
                    HttpStatus.OK,
                  );
                }
                if (
                  imageUrl === null ||
                  imageUrl === undefined ||
                  !isvalidUrl(imageUrl)
                ) {
                  throw new HttpException(
                    'imageUrl must be valid url.',
                    HttpStatus.OK,
                  );
                }
              }
            }
          } else {
            otherDocuments = [];
          }
        }
        dataToBeInsert.push(msmeCartItems[eachItem]);
      }
      return dataToBeInsert;
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
