import { generateSRN } from "../../helper/otpGenerate.helper";
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
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import {
  User,
  UserDocument,
  VerifyStatus,
} from "./../user/entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as moment from "moment";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { errorRes } from "../../helper/errorRes";
import { Role } from "../user-flow/entities/user-flow.entity";
import { urlFields } from "./entities/digital-sign.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import {
  isAadharValid,
  isEmailValid,
  isMobileValid,
  isvalidUrl,
} from "../../helper/basicValidation";
import { status } from "../digital-sign-flow/entities/digital-sign-flow.entity";

export class DigitalSignHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>
  ) {}

  async getBasePrice(userType) {
    const basePriceData = await this.PriceConfigModel.findOne({
      serviceType: serviceType.DSC,
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

  async dscApplicationValidations(req) {
    try {
      const {
        propritorName,
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
        assignedTo,
        assignedBy,
        IsAgreedToTermsAndConditions,
        isRefundApplied,
        isRewardApplied,
      } = req.body;

      const reqParams = [
        "propritorName",
        "srn",
        "email",
        "mobileNumber",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedBy",
        "appliedAs",
        "txnId",
        "payementDetails",
        "version",
        "acknowledgementNumber",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
        "otherDocuments",
        "version",
        "isRewardApplied",
        "isRefundApplied",
      ];

      const requiredKeys = [
        "propritorName",
        "email",
        "mobileNumber",
        "adhaarNumber",
        "address",
        "photoUrl",
        "adhaarCardPhotoUrl",
        "panCardPhotoUrl",
        "otherDocuments",
        "appliedFrom",
        "IsAgreedToTermsAndConditions",
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
        !appliedByTypeUserExist.services?.includes(serviceType.DSC)
      ) {
        throw new HttpException(
          `You are not allow to access this DIGITAL SIGNATURE service.`,
          HttpStatus.OK
        );
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
          req.body.retailerName = retailerExist.name;
          req.body.retailerFirmName = retailerExist.firmName;
          req.body.retailerFirmAddress = retailerExist.address;
          req.body.retailerMobileNumber = retailerExist.mobileNumber;
          req.body.retailerPanNumber = retailerExist.panNumber;
        }
      }

      const dataToSend = {
        distributorCode: distributorCode,
        distributorId: distributorExist ? distributorExist._id : "",
        txnId: "",
        txnObjectId: new mongoose.Types.ObjectId(),
        appliedByType: appliedByTypeUserExist.userType,
        appliedAsType: req.userData.type,
        appliedById: req.userData.Id,
        appliedByName: appliedByTypeUserExist.name,
        appliedOnDate: moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss"),
        appliedByNumber: appliedByTypeUserExist.mobileNumber,
        status: status.BLANK,
        ...req.body,
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
