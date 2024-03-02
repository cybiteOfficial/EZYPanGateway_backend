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

export class GumastaCartData {
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
      serviceType: serviceType.GUMASTA,
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
          convinienceCharges: 0,
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
  async GumastaCartItems(gumastaCartItems, req, res) {
    try {
      const dataToBeInsert = [];
      for (const eachItem in gumastaCartItems) {
        let {
          propritorName,
          adhaarNumber,
          mobileNumber,
          email,
          firmName,
          firmAddress,
          propritorPhotoUrl,
          adhaarPhotoUrl,
          shopOfficePhotoUrl,
          addressProofPhotoUrl,
          otherDocuments,
          state,
          district,
          srn,
          appliedFrom,
          version,
          acknowledgementNumber,
          comments,
        } = gumastaCartItems[eachItem];

        /**check mobile number is valid or not*/
        if (mobileNumber && !isMobileValid(mobileNumber)) {
          throw new HttpException(
            'Mobile number must be a valid number.',
            HttpStatus.OK,
          );
        }

        /**check email is valid or not */
        if (email && !isEmailValid(email)) {
          throw new HttpException('Invalid email Id.', HttpStatus.OK);
        }

        /**check adhar number is valid or not */
        if (adhaarNumber && isAadharValid(adhaarNumber) === false) {
          throw new HttpException(
            'Aadhar number must be valid number.',
            HttpStatus.OK,
          );
        }

        /**check propritorPhotoUrl is valid or not */
        if (propritorPhotoUrl && isvalidUrl(propritorPhotoUrl) === false) {
          throw new HttpException(
            'Photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check shopOfficePhotoUrl is valid or not */
        if (shopOfficePhotoUrl && isvalidUrl(shopOfficePhotoUrl) === false) {
          throw new HttpException(
            'Shop/Office photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check adhar is valid or not */
        if (adhaarPhotoUrl && isvalidUrl(adhaarPhotoUrl) === false) {
          throw new HttpException(
            'Adhaar photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check addressProofPhotoUrl is valid or not */
        if (
          addressProofPhotoUrl &&
          isvalidUrl(addressProofPhotoUrl) === false
        ) {
          throw new HttpException(
            'Address photo url must be valid url.',
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
        dataToBeInsert.push(gumastaCartItems[eachItem]);
      }
      return dataToBeInsert;
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
