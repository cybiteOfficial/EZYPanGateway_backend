import { VerifyStatus } from "./../user/entities/user.entity";
import {
  ItrCategory,
  ItrCategoryDocument,
} from "../itr-category/entities/itr-category.entity";
import { User, UserDocument } from "../user/entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as moment from "moment";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { AddLogFunction } from "../../helper/addLog";
import { errorRes } from "../../helper/errorRes";
import { Role } from "../user-flow/entities/user-flow.entity";
import {
  paymentCategories,
  urlFields,
} from "./entities/itr-application.entity";
import {
  PriceConfig,
  PriceConfigDocument,
  serviceType,
} from "../price-config/entities/price-config.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import { status } from "./entities/itr-application.entity";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";

export class ItrHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ItrCategory.name)
    private itrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>
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

  async getAmount(userType: string, categoryArray: []) {
    try {
      const categories = await this.itrCategoryModel.find(
        { isActive: true, categoryCode: { $in: categoryArray } },
        {
          price: 1,
          categoryCode: 1,
        }
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
              paymentCategories.ADDITIONAL_CAT_2
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
          baseCatAppied: "",
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
          itrCategoryId: "$category.itrCategories",
        },
      },
      { $unwind: "$itrCategoryId" },
      {
        $lookup: {
          from: "itrcategories",
          let: {
            itrCategoryId: "$itrCategoryId",
            requestedCategory: requestedCategory,
          },
          as: "categoryData",
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$_id", "$$itrCategoryId"] } },
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
          categoryName: {
            $arrayElemAt: ["$categoryData.categoryName", 0],
          },
          categoryCode: {
            $arrayElemAt: ["$categoryData.categoryCode", 0],
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

  async itrApplicationValidations(req) {
    try {
      const {
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
        isRewardApplied,
        isRefundApplied,
      } = req.body;

      const reqParams = [
        "firstName",
        "middleName",
        "lastName",
        "adhaarNumber",
        "assesmentYear",
        "incomeSource",
        "fillingType",
        "mobileNumber",
        "emailId",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "panCardPhotoUrl",
        "banPassbookPhotoUrl",
        "otherDocuments",
        "version",
        "paymentCategory",
        "appliedFrom",
        "comments",
        "IsAgreedToTermsAndConditions",
        "isRewardApplied",
        "isRefundApplied",
      ];

      const requiredKeys = [
        "firstName",
        "adhaarNumber",
        "assesmentYear",
        "incomeSource",
        "fillingType",
        "mobileNumber",
        "emailId",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "panCardPhotoUrl",
        "banPassbookPhotoUrl",
        "paymentCategory",
        "appliedFrom",
      ];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );
      if (!isValid.status) {
        throw new HttpException(`${isValid.message}`, HttpStatus.OK);
      }

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const appliedByTypeUserExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!appliedByTypeUserExist) {
        throw new HttpException(`Invalid User.`, HttpStatus.OK);
      }

      if (
        appliedByTypeUserExist.services?.length &&
        !appliedByTypeUserExist.services?.includes(serviceType.ITR)
      ) {
        throw new HttpException(
          `You are not allow to access this ITR service.`,
          HttpStatus.OK
        );
      }

      if (paymentCategory.length) {
        const getCategories = await this.getAllowedCategories(
          requestedId,
          paymentCategory
        );

        if (
          !getCategories.length ||
          getCategories.length !== paymentCategory.length
        ) {
          throw new HttpException(
            "Invalid category in request.",
            HttpStatus.OK
          );
        }
      }

      /**check mobile number is valid or not*/
      if (!isMobileValid(mobileNumber)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check email is valid or not */
      if (emailId && emailId !== "") {
        if (!isEmailValid(emailId)) {
          throw new HttpException("Invalid email Id.", HttpStatus.OK);
        }
      }

      /**check adhar number is valid or not */
      if (adhaarNumber && isAadharValid(adhaarNumber) === false) {
        throw new HttpException(
          "Aadhar number must be valid number.",
          HttpStatus.OK
        );
      }

      /**
       * check all url validations here
       */
      for (const field in urlFields) {
        if (req.body[field] && !isvalidUrl(req.body[field])) {
          throw new HttpException(
            `${urlFields[field]} must be valid url. `,
            HttpStatus.OK
          );
        }
      }

      if (req.body.otherDocuments && req.body.otherDocuments !== "") {
        req.body.otherDocuments = JSON.parse(
          JSON.stringify(req.body.otherDocuments)
        );
        if (!Array.isArray(req.body.otherDocuments)) {
          throw new HttpException(
            "Other documents must be array.",
            HttpStatus.OK
          );
        }
        if (req.body.otherDocuments.length) {
          for (const each in req.body.otherDocuments) {
            if (req.body.otherDocuments[each]) {
              const { title, imageUrl } = req.body.otherDocuments[each];
              if (title === undefined || title === null || title === "") {
                throw new HttpException(
                  "title must not be empty.",
                  HttpStatus.OK
                );
              }
              if (
                imageUrl === null ||
                imageUrl === undefined ||
                !isvalidUrl(imageUrl)
              ) {
                throw new HttpException(
                  "imageUrl must be valid url.",
                  HttpStatus.OK
                );
              }
            }
          }
        } else {
          req.body.otherDocuments = [];
        }
      }

      const distributorCode = req.userData?.sjbtCode || "";

      const distributorExist = await this.userModel.findOne({
        sjbtCode: distributorCode,
        status: VerifyStatus.VERIFIED,
        isActive: true,
        isDeleted: false,
        isVerified: true,
        isBlocked: false,
      });

      if (req.userData.type !== Role.GUEST && !distributorExist) {
        throw new HttpException(
          "Please login with Verified distributor code to apply for application.",
          HttpStatus.OK
        );
      }

      if (req.userData.type === Role.RETAILER) {
        const retailerExist = await this.userModel.findOne({
          _id: new mongoose.Types.ObjectId(req.userData.Id),
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });
        if (retailerExist) {
          req.body.retailerId = retailerExist._id;
          req.body.retailerMobileNumber = retailerExist.mobileNumber;
        }
      }

      const dateToBeInsert = {
        distributorCode: distributorCode,
        distributorId: distributorExist ? distributorExist._id : "",
        appliedByType: appliedByTypeUserExist.userType,
        appliedAsType: req.userData.type,
        appliedById: req.userData.Id,
        appliedByName: appliedByTypeUserExist.name,
        appliedOnDate: moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss"),
        appliedByNumber: appliedByTypeUserExist.mobileNumber,
        txnId: "",
        txnObjectId: new mongoose.Types.ObjectId(),
        status: status.BLANK,
        ...req.body,
      };

      return {
        status: true,
        data: dateToBeInsert,
        statusCode: 200,
      };
    } catch (err) {
      const errData = errorRes(err);
      return {
        status: false,
        data: { ...errData.resData },
        statusCode: errData.statusCode,
      };
    }
  }

  async getCurrentAddressOfUser(userId) {
    //get current address of user
    let userDetails = await this.userModel.findOne({
      _id: userId,
      isDeleted: false,
    });
    let address = userDetails.address;
    let area = userDetails.area;
    let cityVillageName = userDetails.cityVillageName;
    let district = userDetails.district;
    let pincode = userDetails.pincode;
    let state = userDetails.state;
    let fullAddress = `${address}, ${area}, ${cityVillageName}, ${district} ${pincode}, ${state}`;
    return fullAddress;
  }

  async getAppliedUser(appliedById) {
    //get current address of user
    let userDetails = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(appliedById),
    });
    if (!userDetails) {
      console.log("user not found");
    }
    // let userEmail = userDetails.email;
    return userDetails;
  }
}
