/* eslint-disable prefer-const */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ItrCategory,
  ItrCategoryDocument,
} from '../itr-category/entities/itr-category.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import { keyValidationCheck } from '../../helper/keysValidationCheck';
import { AddLogFunction } from '../../helper/addLog';
import { errorRes } from '../../helper/errorRes';
import { Role } from '../user-flow/entities/user-flow.entity';
import {
  PriceConfig,
  PriceConfigDocument,
  serviceType,
} from '../price-config/entities/price-config.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from '../../helper/basicValidation';
import {
  status,
  paymentCategories,
  urlFields,
} from '../itr-application/entities/itr-application.entity';
import {
  RefundWallet,
  RefundWalletDocument,
} from '../refund-wallet/entities/refund-wallet.entity';
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from '../userRewardWallet/entities/userRewardWallet.entity';

export class ItrCartHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ItrCategory.name)
    private itrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
  ) {}

  async getBasePrice(userType) {
    const basePriceData = await this.PriceConfigModel.findOne({
      serviceType: serviceType.ITR,
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

  // async getAmount(userType: string, categoryArray: []) {
  //   try {
  //     const categories = await this.itrCategoryModel.find(
  //       { isActive: true, categoryCode: { $in: categoryArray } },
  //       {
  //         price: 1,
  //         categoryCode: 1,
  //       },
  //     );

  //     const { configBasePrice, configConvinienceCharges } =
  //       await this.getBasePrice(userType);

  //     if (!categoryArray.length) {
  //       return {
  //         status: true,
  //         data: {
  //           totalAmount: configBasePrice,
  //           convinienceCharges: configConvinienceCharges,
  //           basePrice: configBasePrice,
  //           baseCatAppied: paymentCategories.BASIC_SERVICE,
  //         },
  //       };
  //     }

  //     if (categories.length) {
  //       const cat_2 = categories.find((ele) => {
  //         return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_1}`;
  //       });

  //       const cat_3 = categories.find((ele) => {
  //         return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_2}`;
  //       });

  //       const baseCatAppied = cat_2
  //         ? `${paymentCategories.ADDITIONAL_CAT_1}`
  //         : cat_3
  //         ? `${paymentCategories.ADDITIONAL_CAT_2}`
  //         : `${paymentCategories.BASIC_SERVICE}`;

  //       const basePrice = categories.reduce((acc, user) => {
  //         return acc + user.price;
  //       }, 0);

  //       const convinienceCharges = 0;
  //       const totalAmount = configBasePrice + basePrice;

  //       return {
  //         status: true,
  //         data: {
  //           totalAmount,
  //           convinienceCharges,
  //           basePrice,
  //           baseCatAppied,
  //         },
  //       };
  //     }
  //     return {
  //       status: true,
  //       data: {
  //         totalAmount: 0,
  //         convinienceCharges: configConvinienceCharges,
  //         basePrice: configBasePrice,
  //         baseCatAppied: paymentCategories.BASIC_SERVICE,
  //       },
  //     };
  //   } catch (err) {
  //     return {
  //       status: true,
  //       data: {
  //         totalAmount: 0,
  //         convinienceCharges: 0,
  //         basePrice: 0,
  //         baseCatAppied: '',
  //       },
  //     };
  //   }
  // }

  async getAmount(userType: string, categoryArray: []) {
    try {
      const categories = await this.itrCategoryModel.find(
        { isActive: true, categoryCode: { $in: categoryArray } },
        {
          price: 1,
          categoryCode: 1,
        },
      );

      const { configBasePrice, configConvinienceCharges } =
        await this.getBasePrice(userType);

      if (!categoryArray.length) {
        return {
          status: true,
          data: {
            totalAmount: configBasePrice,
            convinienceCharges: configConvinienceCharges,
            basePrice: configBasePrice,
            baseCatAppied: paymentCategories.BASIC_SERVICE,
          },
        };
      }

      if (categories.length) {
        const cat_2 = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_1}`;
        });

        const cat_3 = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_2}`;
        });

        let additionalCat2 = 0;
        let additionalCat3 = 0;
        const baseCatAppied = paymentCategories.BASIC_SERVICE;

        const convinienceCharges = 0;
        //get additional categories price
        if (cat_2 && cat_2 !== undefined) {
          additionalCat2 = cat_2.price;
        }

        if (cat_3 && cat_3 !== undefined) {
          additionalCat3 = cat_3.price;
        }

        //get applied additional categories
        const additionalCategories = [];
        if (cat_2) {
          additionalCategories.push(paymentCategories.ADDITIONAL_CAT_1);
        }
        if (cat_3) {
          additionalCategories.push(paymentCategories.ADDITIONAL_CAT_2);
        }

        //gettotal price for addtional  categories
        let totalAdditionalPrice = 0;
        if (
          !additionalCategories.includes(paymentCategories.ADDITIONAL_CAT_1)
        ) {
          totalAdditionalPrice = cat_3.price;
        } else if (
          !additionalCategories.includes(paymentCategories.ADDITIONAL_CAT_2)
        ) {
          totalAdditionalPrice = cat_2.price;
        } else if (
          additionalCategories.includes(
            paymentCategories.ADDITIONAL_CAT_1 &&
              paymentCategories.ADDITIONAL_CAT_2,
          )
        ) {
          totalAdditionalPrice = cat_2.price + cat_3.price;
        }

        const totalAmount = configBasePrice + totalAdditionalPrice;

        return {
          status: true,
          data: {
            totalAmount,
            additionalCat2,
            additionalCat3,
            convinienceCharges,
            basePrice: configBasePrice,
            baseCatAppied,
          },
        };
      }
      return {
        status: true,
        data: {
          totalAmount: 0,
          additionalCat2: 0,
          additionalCat3: 0,
          convinienceCharges: configConvinienceCharges,
          basePrice: configBasePrice,
          baseCatAppied: paymentCategories.BASIC_SERVICE,
        },
      };
    } catch (err) {
      return {
        status: true,
        data: {
          totalAmount: 0,
          additionalCat2: 0,
          additionalCat3: 0,
          convinienceCharges: 0,
          basePrice: 0,
          baseCatAppied: '',
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

  async getAllowedCategories(requestedId, requestedCategory) {
    const getCategories = await this.userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(requestedId),
          isDeleted: false,
        },
      },
      {
        $project: {
          itrCategoryId: '$category.itrCategories',
        },
      },
      { $unwind: '$itrCategoryId' },
      {
        $lookup: {
          from: 'itrcategories',
          let: {
            itrCategoryId: '$itrCategoryId',
          },
          as: 'categoryData',
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ['$_id', '$$itrCategoryId'] } },
                  { isActive: true },
                ],
              },
            },
            {
              $project: {
                categoryName: 1,
                categoryCode: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          categoryCode: {
            $arrayElemAt: ['$categoryData.categoryCode', 0],
          },
          _id: 0,
        },
      },
      {
        $match: {
          categoryCode: { $in: requestedCategory },
        },
      },
    ]);

    return getCategories;
  }

  async ItrCartItems(itrCartItems: any, req: any, res: any) {
    try {
      const dataToBeInsert = [];
      for (const eachItem in itrCartItems) {
        let {
          firstName,
          middleName,
          lastName,
          adhaarNumber,
          assesmentYear,
          incomeSource,
          fillingType,
          mobileNumber,
          emailId,
          adhaarFrontPhotoUrl,
          adhaarBackPhotoUrl,
          panCardPhotoUrl,
          banPassbookPhotoUrl,
          otherDocuments,
          paymentCategory,
          appliedFrom,
          version,
          comments,
        } = itrCartItems[eachItem];

        if (paymentCategory.length) {
          const getCategories = await this.getAllowedCategories(
            req.userData.Id,
            paymentCategory,
          );

          if (
            !getCategories.length ||
            getCategories.length !== paymentCategory.length
          ) {
            throw new HttpException(
              'Invalid category in request.',
              HttpStatus.OK,
            );
          }
        }

        /**check mobile number is valid or not*/
        if (!isMobileValid(mobileNumber)) {
          throw new HttpException(
            'Mobile number must be a valid number.',
            HttpStatus.OK,
          );
        }

        /**check email is valid or not */
        if (emailId && emailId !== '') {
          if (!isEmailValid(emailId)) {
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

        /**check adhaarFrontPhotoUrl is valid or not */
        if (adhaarFrontPhotoUrl && isvalidUrl(adhaarFrontPhotoUrl) === false) {
          throw new HttpException(
            'Adhaar front photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check adhaarBackPhotoUrl is valid or not */
        if (adhaarBackPhotoUrl && isvalidUrl(adhaarBackPhotoUrl) === false) {
          throw new HttpException(
            'Adhaar back photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check panCardPhotoUrl is valid or not */
        if (panCardPhotoUrl && isvalidUrl(panCardPhotoUrl) === false) {
          throw new HttpException(
            'ITR card photo url must be valid url.',
            HttpStatus.OK,
          );
        }

        /**check banPassbookPhotoUrl is valid or not */
        if (banPassbookPhotoUrl && isvalidUrl(banPassbookPhotoUrl) === false) {
          throw new HttpException(
            'Bank passbook photo url must be valid url.',
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
        dataToBeInsert.push(itrCartItems[eachItem]);
      }
      return dataToBeInsert;
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
