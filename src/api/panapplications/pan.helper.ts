import {
  PanCategory,
  PanCategoryDocument,
  categoryCode,
} from "../pan-category/entities/pan-category.entity";
import {
  PanApplicationFlow,
  PanApplicationFlowDocument,
  status,
} from "./../pan-application-flow/entities/pan-application-flow.entity";
import {
  PriceConfig,
  PriceConfigDocument,
} from "../price-config/entities/price-config.entity";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  Injectable,
  HttpException,
  HttpStatus,
  Redirect,
} from "@nestjs/common";
import {
  User,
  UserDocument,
  VerifyStatus,
} from "./../user/entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as moment from "moment";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { AddLogFunction } from "../../helper/addLog";
import { errorRes } from "../../helper/errorRes";
import { Role } from "../user-flow/entities/user-flow.entity";
import {
  applicationTypes,
  PanApplication,
  PanDocument,
  formCategory,
  urlFields,
  paymentCategories,
} from "./entities/pan.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import { Client } from "../../helper/initRedis";

export class PanHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PanCategory.name)
    private panCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>,
    private readonly addLogFunction: AddLogFunction
  ) {}

  async getBasePrice(userType) {
    const basePriceData = await this.PriceConfigModel.findOne({
      serviceType: serviceType.PAN,
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
      const { configBasePrice, configConvinienceCharges } =
        await this.getBasePrice(userType);
      if (!categoryArray.length) {
        return {
          status: true,
          data: {
            totalAmount: configBasePrice + configConvinienceCharges,
            convinienceCharges: configConvinienceCharges,
            basePrice: configBasePrice,
            baseCatAppied: paymentCategories.BASIC_SERVICE,
          },
        };
      }

      const categories = await this.panCategoryModel.find(
        { isActive: true, categoryCode: { $in: categoryArray } },
        {
          price: 1,
          categoryCode: 1,
        }
      );

      if (categories.length) {
        const catDsa = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.CAT_DSA}`;
        });
        const catPco = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.CAT_PCO}`;
        });

        const additionalone = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_1}`;
        });
        const additionalsecond = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_2}`;
        });

        let additionalCat2 = 0;
        let additionalCat3 = 0;
        let mainCategoryPrice = 0;
        if (additionalone && additionalone !== undefined) {
          additionalCat2 = additionalone.price;
        }

        if (additionalsecond && additionalsecond !== undefined) {
          additionalCat3 = additionalsecond.price;
        }

        const baseCatAppied = catDsa
          ? `${paymentCategories.CAT_DSA}`
          : catPco
          ? `${paymentCategories.CAT_PCO}`
          : `${paymentCategories.BASIC_SERVICE}`;

        const basePrice =
          baseCatAppied === `${paymentCategories.CAT_DSA}`
            ? catDsa.price
            : baseCatAppied === `${paymentCategories.CAT_PCO}`
            ? catPco.price
            : configBasePrice;
        const convinienceCharges =
          baseCatAppied === `${paymentCategories.CAT_DSA}` ||
          baseCatAppied === `${paymentCategories.CAT_PCO}`
            ? 0
            : configConvinienceCharges;

        mainCategoryPrice = basePrice + convinienceCharges;

        const totalAmount = categories.reduce((acc, ele) => {
          if (ele.categoryCode !== baseCatAppied) {
            acc += ele.price;
          }
          return acc;
        }, basePrice + convinienceCharges);

        return {
          status: true,
          data: {
            totalAmount,
            convinienceCharges,
            mainCategoryPrice,
            additionalCat2,
            additionalCat3,
            basePrice,
            baseCatAppied,
          },
        };
      }
    } catch (err) {
      return {
        status: true,
        data: {
          totalAmount: 0,
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
          panCategoryId: "$category.panCategories",
        },
      },
      { $unwind: "$panCategoryId" },
      {
        $lookup: {
          from: "pancategories",
          let: {
            panCategoryId: "$panCategoryId",
            requestedCategory: requestedCategory,
          },
          as: "categoryData",
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$_id", "$$panCategoryId"] } },
                  { isActive: true },
                ],
              },
            },
            {
              $project: {
                categoryName: 1,
                applicableForMinor: 1,
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
          applicableForMinor: {
            $arrayElemAt: ["$categoryData.applicableForMinor", 0],
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

  async checkApplicableForMinor(getCategories, paymentCategory) {
    const resToSend = {
      status: true,
      message: "",
    };

    const minorCategories = getCategories.reduce((acc, category) => {
      if (
        paymentCategory.includes(category.categoryCode) &&
        !category.applicableForMinor
      ) {
        acc.status = false;
        acc.message += `${category.categoryCode} is not applicable for minor.`;
      }
      return acc;
    }, resToSend);
    return minorCategories;
  }

  async panApplicationValidations(req) {
    try {
      const {
        category,
        title,
        name,
        dob,
        email,
        parentName,
        parentType,
        adhaarNumber,
        mobileNumber,
        panCardFront,
        passportPhotoUrl,
        signaturePhotoUrl,
        panFormFrontPhotoUrl,
        panFormBackPhotoUrl,
        adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl,
        panNumber,
        acknowledgementNumber,
        comments,
        appliedFrom,
        IsAgreedToTermsAndConditions,
        otherDocuments,
        paymentCategory,
        version,
        isRewardApplied,
        isRefundApplied,
      } = req.body;

      const reqParams = [
        "category",
        "title",
        "name",
        "dob",
        "email",
        "parentName",
        "parentType",
        "adhaarNumber",
        "mobileNumber",
        "panCardFront",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "panNumber",
        "acknowledgementNumber",
        "comments",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "otherDocuments",
        "paymentCategory",
        "version",
        "isRewardApplied",
        "isRefundApplied",
      ];

      let requiredKeys = [
        "category",
        "title",
        "name",
        "dob",
        "email",
        "adhaarNumber",
        "mobileNumber",
        "passportPhotoUrl",
        "signaturePhotoUrl",
        "panFormFrontPhotoUrl",
        "panFormBackPhotoUrl",
        "adhaarFrontPhotoUrl",
        "adhaarBackPhotoUrl",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "paymentCategory",
      ];

      /**check if application type is correction then category is not required */
      if (panNumber && panNumber !== "") {
        requiredKeys = [
          "title",
          "name",
          "dob",
          "email",
          "adhaarNumber",
          "mobileNumber",
          "passportPhotoUrl",
          "signaturePhotoUrl",
          "panFormFrontPhotoUrl",
          "adhaarFrontPhotoUrl",
          "adhaarBackPhotoUrl",
          "appliedFrom",
          "IsAgreedToTermsAndConditions",
          "paymentCategory",
        ];
      }

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

      /**
       * if  isRewardApplied,
        isRefundApplied, are present in body the add validation according to their requestedType usertype
       */

      if (panNumber == "" && !(category === formCategory.INDIVIDUAL)) {
        throw new HttpException(
          `Contact us for this applied category.`,
          HttpStatus.OK
        );
      }

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
        !appliedByTypeUserExist.services?.includes(serviceType.PAN)
      ) {
        throw new HttpException(
          `You are not allow to access this PAN service.`,
          HttpStatus.OK
        );
      }
      req.body.appliedByType = appliedByTypeUserExist.userType;
      req.body.appliedByName = appliedByTypeUserExist.name;
      req.body.appliedByNumber = appliedByTypeUserExist.mobileNumber;

      /**check dob format is valid or not */
      if (dob && !isValidDate(dob)) {
        throw new HttpException(
          "Date must be in YYYY-MM-DD format.",
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

        if (isMinor(dob)) {
          const checkMinor = await this.checkApplicableForMinor(
            getCategories,
            req.body.paymentCategory
          );
          if (!checkMinor.status) {
            throw new HttpException(checkMinor.message, HttpStatus.OK);
          }
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
      if (email && email !== "") {
        if (!isEmailValid(email)) {
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
      req.body.distributorCode = distributorCode;
      // if (req.userData.type !== Role.GUEST && !distributorExist) {
      //   let userId = req.userData.Id;
      //   const tokenKey = `${userId}*`;
      //   Client.KEYS(tokenKey, async (err: any, keys: any) => {
      //     if (err) {
      //       console.log("Some error occurred", err);
      //     }

      //     if (!keys || keys.length === 0) {
      //       console.log("No keys found.");
      //     }

      //     const deletePromises = keys.map((key: any) => Client.DEL(key));
      //     await Promise.all(deletePromises);
      //   });
      // }

      if (req.userData.type !== Role.GUEST && !distributorExist) {
        throw new HttpException(
          "Please login with Verified distributor code to apply for application.",
          HttpStatus.OK
        );
      }
      req.body.distributorId = distributorExist ? distributorExist._id : "";

      if (req.userData.type === Role.RETAILER) {
        const retailerExist = await this.userModel.findOne({
          _id: new mongoose.Types.ObjectId(req.userData.Id),
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });

        if (retailerExist) {
          req.body.retailerId = retailerExist._id;
          req.body.retailerName = retailerExist.name;
          req.body.retailerFirmName = retailerExist.firmName;
          req.body.retailerFirmAddress = retailerExist.address;
          req.body.retailerMobileNumber = retailerExist.mobileNumber;
          req.body.retailerPanNumber = retailerExist.panNumber;
        }
      }

      const dataToSend = {
        ...req.body,
        distributorCode: distributorCode,
        distributorId: distributorExist ? distributorExist._id : "",
        txnId: "",
        txnObjectId: new mongoose.Types.ObjectId(),
        applicationType:
          panNumber === "" || !panNumber
            ? applicationTypes.NEW
            : applicationTypes.CORRECTION,
        appliedAsType: req.userData.type,
        appliedById: req.userData.Id,
        appliedOnDate: moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss"),
        status: status.BLANK, /// update PAYYMENT_PENDING here once payment gateway applied.
      };

      return {
        status: true,
        data: dataToSend,
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
