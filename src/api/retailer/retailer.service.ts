import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import {
  PanCategory,
  PanCategoryDocument,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategoryDocument,
} from "../itr-category/entities/itr-category.entity";
import {
  Role,
  subscriptionPayment,
  User,
  UserDocument,
  VerifyStatus,
} from "../user/entities/user.entity";
import {
  UserFlow,
  UserFlowDocument,
} from "../user-flow/entities/user-flow.entity";
import {
  isEmailValid,
  isMobileValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import * as moment from "moment";
import { generateOTP } from "../../helper/otpGenerate.helper";
import { errorRes } from "../../helper/errorRes";
import { createToken, otpToken } from "../../helper/tokenCreate";
import mongoose from "mongoose";
import { Client } from "../../helper/initRedis";
import { AddLogFunction } from "../../helper/addLog";
import { checkProfile } from "../../helper/profileComplete";
import { hash } from "bcrypt";
import { isAfter } from "date-fns";
import { Otp, OtpDocument, ValidOtp } from "../otp/entity/create-otp.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import { userAuthHelper } from "../../auth/auth.helper";
import { extractFieldsForUserFlowTable } from "../../helper/changeStatus";
import { checkRetailersWithDistributorCode } from "../../helper/checkRetailerCount";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import { smsTemplateService } from "../../helper/smsTemplates";
import { EmailService } from "../../helper/sendEmail";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
import {
  DistributorRetailerDocument,
  DistributorRetailers,
} from "../distributor-retailers/entities/distributor-retailers.entity";

@Injectable()
export class RetailerService {
  [x: string]: any;
  constructor(
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
    private readonly checkProfile: checkProfile,
    private readonly EmailService: EmailService,
    private readonly smsTemplateService: smsTemplateService,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserFlow.name)
    private readonly UserFlowModel: Model<UserFlowDocument>,
    @InjectModel(PanCategory.name)
    private readonly PanCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(ItrCategory.name)
    private readonly ItrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(UserRewardWallet.name)
    private readonly UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    @InjectModel(DistributorRetailers.name)
    private readonly DistributorRetailerModel: Model<DistributorRetailerDocument>,
    private readonly checkRetailers: checkRetailersWithDistributorCode,
    private readonly refundWalletAmt: refundWalletAmt,
    private readonly digitalPanWalletAmt: WalletAmt
  ) {}

  //-------------------------------------------------------------------------
  /***
   * Login retailer
   */

  async login(req: any, res: any) {
    try {
      const { sjbtCode, mobileNumber } = req.body;
      const reqParams = ["sjbtCode", "mobileNumber"];
      const requiredKeys = ["sjbtCode", "mobileNumber"];
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: "BAD_REQUEST",
          issue: "REQUEST_BODY_VALIDATION_FAILED",
          data: null,
        });
      }

      let msg91Data = {
        template_id: process.env.MSG91_OTP_TEMPLATE_ID,
        sender: process.env.MSG91_SENDER_ID,
        short_url: "0",
        mobiles: "+91" + req.body.mobileNumber,
        otp: "",
      };

      if (!isMobileValid(mobileNumber)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check sjbt code exist or not*/
      let distributorData = await this.userModel.findOne({
        sjbtCode: sjbtCode,
        userType: Role.DISTRIBUTOR,
        status: VerifyStatus.VERIFIED,
        isVerified: true,
        isDeleted: false,
      });

      if (!distributorData) {
        throw new HttpException("Distributor not found.", HttpStatus.OK);
      }

      distributorData = JSON.parse(JSON.stringify(distributorData));

      /**check account verified or not*/
      if (!distributorData.isActive) {
        throw new HttpException(
          `Distributor's account is under review.`,
          HttpStatus.OK
        );
      }
      // if ( distributorData.emailVerified == false )
      // {
      //   throw new HttpException( `Email ID is not verified.`, HttpStatus.OK );
      // }

      // if (!distributorData.mobileNumberVerified) {
      //   throw new HttpException(
      //     `Mobile Number is not verified.`,
      //     HttpStatus.OK,
      //   );
      // }

      /**check if block*/
      if (distributorData.isBlocked) {
        throw new HttpException(
          "Distributor's account is blocked.",
          HttpStatus.OK
        );
      }

      /**check if distributor*/
      if (
        distributorData &&
        distributorData.mobileNumber === req.body.mobileNumber
      ) {
        throw new HttpException(
          "You are already a distributor. You can not login as a retailer. Please login as a distributor.",
          HttpStatus.OK
        );
      }
      const retailerExist = await this.userModel.findOne({
        mobileNumber: mobileNumber,
        isDeleted: false,
      });

      let retailerData: any;
      let userFlowData: any;

      if (retailerExist) {
        let retailerDataToBeUpdate = {};
        if (
          retailerExist.userType == Role.DISTRIBUTOR &&
          retailerExist.status == VerifyStatus.VERIFIED
        ) {
          throw new HttpException(
            `You are already a distributor. Please login as a distributor.`,
            HttpStatus.OK
          );
        }
        if (!retailerExist.isActive) {
          throw new HttpException(
            `Your account is under review.`,
            HttpStatus.OK
          );
        }
        if (retailerExist.isBlocked) {
          throw new HttpException(`Your account is blocked.`, HttpStatus.OK);
        }
        retailerData = retailerExist;

        if (retailerExist.userType === Role.GUEST) {
          retailerDataToBeUpdate = {
            $set: {
              userType: Role.RETAILER,
              role: Role.RETAILER,
              services: distributorData.services,
              category: distributorData.category,
            },
            $addToSet: {
              allDistributor: {
                distributorId: distributorData._id,
                sjbtCode: distributorData.sjbtCode,
                date: currentDate,
              },
            },
          };
        }

        if (retailerExist.userType === Role.RETAILER) {
          if (
            req.body.sjbtCode !== null &&
            req.body.sjbtCode !== undefined &&
            req.body.sjbtCode !== ""
          ) {
            const allDistributor = retailerExist.allDistributor;
            const findSjbtCodeAlreadyExist = allDistributor.find(
              (el) => el.sjbtCode === req.body.sjbtCode
            );

            if (!findSjbtCodeAlreadyExist) {
              retailerDataToBeUpdate = {
                $set: {
                  services: distributorData.services,
                  category: distributorData.category,
                },
                $push: {
                  allDistributor: {
                    distributorId: distributorData._id,
                    sjbtCode: distributorData.sjbtCode,
                    date: currentDate,
                  },
                },
              };
            } else {
              retailerDataToBeUpdate = {
                $set: {
                  services: distributorData.services,
                  category: distributorData.category,
                },
              };
            }
          }
        }

        const updateRetailerData = await this.userModel.findOneAndUpdate(
          {
            _id: retailerExist._id,
          },
          retailerDataToBeUpdate,
          { new: true }
        );

        if (!updateRetailerData) {
          throw new HttpException(
            "Something went wrong. Unable to register retailer. Please try again.",
            HttpStatus.OK
          );
        }
        retailerData = updateRetailerData;
        userFlowData = updateRetailerData;
        userFlowData["userId"] = updateRetailerData._id;
        delete userFlowData._id;
      }

      if (!retailerExist) {
        const newRetailerData = {
          mobileNumber: req.body.mobileNumber,
          userType: Role.RETAILER,
          role: Role.RETAILER,
          allDistributor: [
            {
              distributorId: distributorData._id,
              sjbtCode: sjbtCode,
              date: currentDate,
            },
          ],
          category: distributorData.category,
          services: distributorData.services,
        };

        const retailerAdded = await new this.userModel({
          ...newRetailerData,
        }).save();

        if (!retailerAdded) {
          throw new HttpException(
            "Something went wrong, Unable to regitser retailer. Please try again.",
            HttpStatus.OK
          );
        }
        retailerData = retailerAdded;

        const checkretailer = await this.checkRetailers.checkCount(
          sjbtCode,
          distributorData._id,
          retailerAdded._id,
          retailerAdded.mobileNumber
        );

        const createRefundWallet = await this.refundWalletAmt.createWallet(
          req.body.uuid,
          retailerAdded._id.toString()
        );

        const updatedUserFlowFields = await extractFieldsForUserFlowTable(
          retailerAdded
        );
        const updateUserFlow = await new this.UserFlowModel({
          userId: retailerAdded._id,
          ...updatedUserFlowFields,
        }).save();
      }

      //generate otp

      const OTP = await generateOTP(req);
      if (parseInt(mobileNumber) === parseInt(process.env.RETAILER_MOBILE)) {
        OTP.mobileOTP = 123456;
      }

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.findOneAndUpdate(
          {
            userId: retailerData._id,
            userType: Role.RETAILER,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: retailerData._id,
            userType: Role.RETAILER,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            emailOTP: OTP.emailOTP,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          { new: true, upsert: true }
        );
      }
      if (OTP.mobileOTP) {
        const otpDataUpdate = await this.otpModel.findOneAndUpdate(
          {
            userId: retailerData._id,
            userType: Role.RETAILER,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: retailerData._id,
            userType: Role.RETAILER,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            mobileOTP: OTP.mobileOTP,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          { new: true, upsert: true }
        );
      }

      msg91Data.otp = OTP.mobileOTP;

      const msgSent: any = await sendMsg91Function(msg91Data);
      if (!msgSent || !msgSent["sendStatus"]) {
        throw new HttpException(
          "Couldn't send otp on entered mobile number. Please try again.",
          HttpStatus.OK
        );
      }

      const token = await otpToken(retailerData, req, Role.RETAILER, sjbtCode);
      const requestedId = retailerData?.Id || "";
      const requestedType = retailerData?.type || "";

      /***add retailers data in distributor retailers table**/
      if (retailerData.allDistributor.length) {
        for (let each in retailerData.allDistributor) {
          const { distributorId, sjbtCode, date, _id } =
            retailerData.allDistributor[each];
          let retailerId = retailerData._id.toString();
          let dataToInsert = {
            _id: _id,
            distributorId: distributorId,
            retailerId: retailerId,
            sjbtCode: sjbtCode,
            loginDate: date,
          };
          let retailerAlreadyExist =
            await this.DistributorRetailerModel.findOne({
              distributorId: distributorId,
              retailerId: retailerId,
            });
          if (!retailerAlreadyExist) {
            const retailersAdded = await new this.DistributorRetailerModel({
              ...dataToInsert,
            }).save();
          }
        }
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        Role.RETAILER,
        "RETAILER_LOGIN",
        retailerData.mobileNumber,
        true,
        200,
        `${retailerData.userType} ${retailerData.mobileNumber} tried to login as a retailer at ${currentDate}.`,
        "Successfull! Please verify OTP",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        status: true,
        message: "Successfull! Please verify OTP",
        token: token,
        data: {
          userId: retailerData._id,
          mobileNumber: retailerData.mobileNumber,
          UserType: "RETAILER",
          // otp: OTP,
        },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        Role.RETAILER,
        "RETAILER_LOGIN",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to login with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   *verify otp
   */
  //-------------------------------------------------------------------------

  async verifyOtp(req, res) {
    try {
      if (!req.headers.deviceid) {
        return res.status(200).send({
          message: "Device Id is required.",
          code: "DEVICE_ID_NOT_FOUND.",
          issue: "DEVICE_ID_REQUIRED",
          status: false,
        });
      }

      const { otp } = req.body;
      const reqParams = ["otp"];
      const requiredKeys = ["otp"];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );

      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: "BAD_REQUEST",
          issue: "REQUEST_BODY_VALIDATION_FAILED",
          data: null,
        });
      }

      const userId = req.otpData.Id;
      const otpUserType = req.otpData.type;
      const requestedId = req.otpData?.Id || "";
      const requestedType = req.otpData?.type || "";
      const sjbtCode = req.otpData?.sjbtCode || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userExist = await this.userModel.findOne({
        _id: userId,
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });

      if (!userExist) {
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }

      let otp_id = "";

      const otpKey =
        req.otpData.token_type === "EMAIL_OTP" ? "emailOTP" : "mobileOTP";

      const otpType =
        req.otpData.token_type === "EMAIL_OTP" ? "EMAIL" : "MOBILE";

      const keyToUpdate =
        req.otpData.token_type === "EMAIL_OTP"
          ? "emailVerified"
          : "mobileNumberVerified";

      const verifyOtp = await this.otpModel.findOne({
        userId: userId,
        [otpKey]: otp,
        userType: otpUserType,
        isOtpUsed: false,
        otpType: otpType,
      });

      if (!verifyOtp) {
        throw new HttpException(
          `Invalid otp. Please enter correct otp.`,
          HttpStatus.OK
        );
      }

      otp_id = verifyOtp._id.toString();

      const istokenExpired = isAfter(new Date(), new Date(verifyOtp.expiresIn));

      if (istokenExpired) {
        throw new HttpException(
          `Otp expired. Please try again.`,
          HttpStatus.OK
        );
      }

      const otpUpdate = await this.otpModel.findOneAndUpdate(
        {
          _id: otp_id,
          [otpKey]: otp,
          userType: req.otpData.type,
        },
        {
          $set: { isOtpUsed: true },
        },
        {
          new: true,
        }
      );

      if (otpUpdate) {
        const updateRetailerData = await this.userModel.findOneAndUpdate(
          { _id: userId },
          { [keyToUpdate]: true },
          { new: true }
        );
        if (updateRetailerData) {
          const userFlowData = updateRetailerData;
          userFlowData["userId"] = userId;
          delete userFlowData._id;
          const updatedUserFlow = await new this.UserFlowModel({
            ...userFlowData,
          }).save();
        }
      }

      //---------create-token---------//

      const userType = userExist.userType;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;

      const token = await createToken(userExist, Role.RETAILER, sjbtCode);
      const tokenString = `${token.accessToken}${process.env.TOKEN_KEY}${token.refreshToken}`;

      Client.SET(
        userDetails,
        tokenString,
        "EX",
        365 * 24 * 60 * 60,
        (err, result) => {
          if (err) {
            throw new HttpException("Something went wrong.", HttpStatus.OK);
          } else {
            this.addLogFunction.logAdd(
              req,
              requestedType,
              requestedId,
              Role.RETAILER,
              "RETAILER_OTP_VERIFY",
              "",
              true,
              200,
              `${requestedType} ${userExist.mobileNumber} verified OTP at ${currentDate}.`,
              "Login successfully.",
              req.socket.remoteAddress
            );
            return res.status(200).send({
              status: true,
              message: "Login successfull.!",
              token: token,
              data: {
                userType: req.otpData.type,
                isProfileComplete: userExist.isProfileComplete,
                redirectTo:
                  userExist.subscriptionPayment === subscriptionPayment.PENDING
                    ? "Buy subscription page"
                    : null,
              },
              code: "OK",
              issue: null,
            });
          }
        }
      );
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.otpData?.type || "",
        req.otpData?.Id || "",
        Role.RETAILER,
        "RETAILER_OTP_VERIFY",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.otpData?.type || ""} ${
          req.otpData?.Id || ""
        } tried to login with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")} on ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}`,
        errData.resData.message,
        req.socket.remoteAddress
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
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
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
        req.body.isPaginationRequired === "false" ||
        req.body.isPaginationRequired === false
          ? false
          : true;

      const searchKeys = [
        "_id",
        "name",
        "firmName",
        "userType",
        "sjbtCode",
        "mobileNumber",
        "isDeleted",
        "isActive",
        "isVerified",
        "emailVerified",
        "mobileNumberVerified",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }, { userType: Role.RETAILER }],
      };

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
        orderBy === "" ||
        typeof orderBy !== "string"
      ) {
        orderBy = "createdAt";
      }

      if (
        orderByValue === undefined ||
        orderByValue === "" ||
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
          if (searchIn[key] === "") {
            throw new HttpException(
              `params key should not be blank`,
              HttpStatus.OK
            );
          }

          if (!searchKeys.includes(searchIn[key])) {
            throw new HttpException(
              `params ${searchIn[key]} key does not exist.`,
              HttpStatus.OK
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
        searchValue !== "" &&
        searchValue !== null
      ) {
        const value = { $regex: `.*${searchValue}.*`, $options: "i" };
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
        typeof rangeFilterBy === "object"
      ) {
        if (
          rangeFilterBy.rangeFilterKey !== undefined &&
          rangeFilterBy.rangeFilterKey !== "" &&
          rangeFilterBy.rangeFilterKey !== null &&
          typeof rangeFilterBy.rangeFilterKey === "string"
        ) {
          if (
            rangeFilterBy.rangeInitial !== undefined &&
            rangeFilterBy.rangeInitial !== "" &&
            rangeFilterBy.rangeInitial !== null &&
            !isNaN(parseFloat(rangeFilterBy.rangeInitial))
          ) {
            if (
              rangeFilterBy.rangeEnd !== undefined &&
              rangeFilterBy.rangeEnd !== "" &&
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
      const invalidData = ["null", null, undefined, "undefined", ""];
      const booleanFields = [
        "isActive",
        "isDeleted",
        "isVerified",
        "emailVerified",
        "mobileNumberVerified",
      ];
      const numberFileds = [];

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
              } else if (filterBy[each].value !== "") {
                if (
                  typeof filterBy[each].value === "string" &&
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
                  typeof filterBy[each].value === "boolean" ||
                  booleanFields.includes(filterBy[each].fieldName)
                ) {
                  filterQuery.push({
                    [filterBy[each].fieldName]:
                      filterBy[each].value === true ||
                      filterBy[each].value === "true"
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

      const allowedDateFiletrKeys = ["createdAt", "updatedAt"];
      if (
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
        if (
          dateFilter.dateFilterKey !== undefined &&
          dateFilter.dateFilterKey !== ""
        ) {
          if (!allowedDateFiletrKeys.includes(dateFilter.dateFilterKey)) {
            throw new HttpException(
              `Date filter key is invalid.`,
              HttpStatus.OK
            );
          }
        } else {
          dateFilter.dateFilterKey = "createdAt";
        }
        if (
          dateFilter.start_date !== undefined &&
          dateFilter.start_date !== "" &&
          (dateFilter.end_date === undefined || dateFilter.end_date === "")
        ) {
          dateFilter.end_date = dateFilter.start_date;
        } else if (
          dateFilter.end_date !== undefined &&
          dateFilter.end_date !== "" &&
          (dateFilter.start_date === undefined || dateFilter.start_date === "")
        ) {
          dateFilter.start_date = dateFilter.end_date;
        }
        if (dateFilter.start_date !== "" && dateFilter.end_date !== "") {
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
                        to: "date",
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
                        to: "date",
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
      const additionaQuery = [{ $unset: ["__v", "password"] }];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;
      const dataFound = await this.userModel.aggregate(countQuery);
      if (dataFound.length === 0) {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
      totalData = dataFound.length;
      let totalpages = 1;
      if (isPaginationRequired) {
        totalpages = Math.ceil(totalData / (limit === "" ? totalData : limit));
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

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "RETAILERS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        query.push({ $project: projectQuery });
      }

      const result = await this.userModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          Role.RETAILER,
          "RETAILER_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data to view retailer at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: result,
          totalPage: totalpages,
          status: true,
          currentPage: page,
          totalItem: totalData,
          pageSize: limit,
          message: "Data Found successfully.",
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`No data Found`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        Role.RETAILER,
        "RETAILER_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data for view retailer with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * find retailer
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";

      const query = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        userType: Role.RETAILER,
      };

      /**project query for admin role */
      let projectData = {};
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "RETAILERS"
        );

        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields
        );
        projectData = projectQuery;
      }

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userFound = await this.userModel
        .aggregate([
          {
            $match: { ...query },
          },
          {
            $unset: ["password", "__v"],
          },
        ])
        .exec();

      if (!userFound.length) {
        throw new HttpException("Retailer not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        Role.RETAILER,
        "RETAILER_VIEW",
        "",
        true,
        200,
        `${requestedType} ${userFound[0].mobileNumber} view at ${currentDate}.`,
        "Data Found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Retailer found successfully.",
        status: true,
        data: userFound[0],
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        Role.RETAILER,
        "RETAILER_VIEW",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data for view retailer with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * update all status
   * */
  //-------------------------------------------------------------------------
  // async updateStatus(id: string, res) {
  //      try {
  // requestedId = requestedId;
  // requestedType = requestedType;
  //     const currentDate = moment().utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');

  //     const userFound = await this.userModel
  //       .findOne({
  //         _id: new mongoose.Types.ObjectId(id),
  //         userType: Role.RETAILER,
  //         status: 'PENDING',
  //       })
  //       ;

  //     if (!userFound) {
  //       throw new HttpException(`User not found.`, HttpStatus.OK);
  //     }

  //     await this.userModel.findByIdAndUpdate(
  //       { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
  //       { status: 'BLOCKED', isBlocked: true },
  //       { new: true },
  //     );

  //     await this.UserFlowModel.findOneAndUpdate(
  //       { userId: id, isDeleted: false },
  //       { status: 'BLOCKED', isBlocked: true },
  //       { new: true },
  //     );

  //      this.addLogFunction.logAdd(
  //   req,
  //   adminExist.role,
  //   adminId,
  //   'ADMIN',
  //   'ADMIN_LOGIN',
  //   adminId,
  //   true,
  //   200,
  //   `${adminExist.role} ${adminExist.userName} login at ${currentDate}.`,
  //   'Login successfull!',
  // );  return res.status(200).send({
  //       message: `User blocked successfully.`,
  //       status: true,
  //       data: null,
  //     });
  //   } catch (err) {
  //     const errData = errorRes(err);
  //     return res.status(errData.statusCode).send({ ...errData.resData });
  //   }
  // }

  //-------------------------------------------------------------------------
  /***
   * find all
   */
  //-------------------------------------------------------------------------

  async list(search, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let searchValue = req.query.search;
      searchValue = { $regex: `.*${searchValue}.*`, $options: "i" };
      let dataFound;
      if (searchValue !== "") {
        dataFound = await this.userModel.find(
          { userType: Role.RETAILER, name: searchValue, isDeleted: false },
          { _id: 1, mobileNumber: 1, name: 1 }
        );
      } else {
        dataFound = await this.userModel.find(
          { userType: Role.RETAILER, isDeleted: false },
          { _id: 1, mobileNumber: 1, name: 1 }
        );
      }

      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        Role.RETAILER,
        "RETAILER_LIST",
        "",
        true,
        200,
        `${requestedType} check list of retailer at ${currentDate}.`,
        "Retailer found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: dataFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        Role.RETAILER,
        "RETAILER_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of retailer with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * block user
   * */
  //-------------------------------------------------------------------------
  async blockUser(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!userFound) {
        throw new HttpException(`Retailer not found.`, HttpStatus.OK);
      }

      const activeKey = userFound.isBlocked === true ? false : true;
      const keyValue = activeKey === true ? "BLOCK" : "UNBLOCK";

      const result = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isBlocked: activeKey } },
        { new: true }
      );

      const userFlowData = result;
      userFlowData["userId"] = result._id.toString();
      delete userFlowData._id;
      const updatedUserFlow = await new this.UserFlowModel({
        ...userFlowData,
      }).save();

      const userId = result._id.toString();
      const tokenKey = `${userId}*`;

      Client.KEYS(tokenKey, async (err: any, keys: any) => {
        if (err) {
          console.log("Some error occurred", err);
        }

        if (!keys || keys.length === 0) {
          console.log("No keys found.");
        }

        const deletePromises = keys.map((key: any) => Client.DEL(key));
        await Promise.all(deletePromises);

        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          Role.RETAILER,
          "RETAILER_BLOCK_USER",
          id,
          true,
          200,
          `${requestedType} ${userFound.mobileNumber} ${keyValue} user ${id} at ${currentDate}.`,
          `${keyValue} retailer successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Retailer's account ${keyValue} successfully.`,
          status: true,
          data: null,
          code: "OK",
          issue: null,
        });
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        Role.RETAILER,
        "RETAILER_BLOCK_USER",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to block user ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * apply for distributor
   */
  //-------------------------------------------------------------------------

  async applyForDistributor(res, req) {
    try {
      const {
        name,
        email,
        mobileNumber,
        dob,
        fatherName,
        firmName,
        address,
        area,
        cityVillageName,
        district,
        pincode,
        state,
        adhaarCardImage,
        panCardImage,
        cancelChequeImage,
        declarationFormPhotoUrl,
        password,
        confirmPassword,
        panNumber,
        allDistributor,
        category,
        service,
      } = req.body;

      const reqParams = [
        "name",
        "email",
        "mobileNumber",
        "dob",
        "fatherName",
        "firmName",
        "address",
        "area",
        "cityVillageName",
        "district",
        "pincode",
        "state",
        "adhaarCardImage",
        "panCardImage",
        "cancelChequeImage",
        "declarationFormPhotoUrl",
        "password",
        "confirmPassword",
        "panNumber",
        "allDistributor",
        "category",
        "service",
      ];
      const requiredKeys = [
        "name",
        "dob",
        "fatherName",
        "firmName",
        "address",
        "area",
        "cityVillageName",
        "district",
        "pincode",
        "state",
        "adhaarCardImage",
        "panCardImage",
        "cancelChequeImage",
        "password",
        "confirmPassword",
        "panNumber",
      ];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: "BAD_REQUEST",
          issue: "REQUEST_BODY_VALIDATION_FAILED",
          data: null,
        });
      }

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      /**
       * check email and mobile already exist
       */
      if (email && email !== "") {
        /**check email is valid or not */
        if (!isEmailValid(email)) {
          throw new HttpException("Invalid email Id.", HttpStatus.OK);
        }
        const emailExists = await this.userModel.findOne({
          email: email,
          isDeleted: false,
          _id: { $ne: new mongoose.Types.ObjectId(req.userData.Id) },
        });

        if (emailExists) {
          throw new HttpException(
            "Another user exist with same email.",
            HttpStatus.OK
          );
        }
      }

      /**mobile number check */
      if (mobileNumber && mobileNumber !== "") {
        /**check mobile number is valid or not*/
        if (!isMobileValid(mobileNumber)) {
          throw new HttpException(
            "Mobile number must be a valid number.",
            HttpStatus.OK
          );
        }

        const mobileExists = await this.userModel.findOne({
          mobileNumber: mobileNumber,
          isDeleted: false,
          _id: { $ne: new mongoose.Types.ObjectId(req.userData.Id) },
        });

        if (mobileExists) {
          throw new HttpException(
            "Another user exist with same mobile number.",
            HttpStatus.OK
          );
        }
      }

      const panCardNumberExist = await this.userModel.findOne({
        panNumber: panNumber,
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(req.userData.Id) },
      });
      if (panCardNumberExist) {
        throw new HttpException("PAN number already exist.", HttpStatus.OK);
      }

      /**
       * check userexist
       */
      const userExist = await this.userModel.findOne({
        _id: req.userData.Id,
        isDeleted: false,
        isBlocked: false,
        isActive: true,
      });
      if (!userExist) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
      }

      const msg91Data = {
        flow_id: process.env.MSG91_FLOW_ID_LOGIN_OTP,
        sender: process.env.MSG91_SENDER_ID,
        mobiles: "91" + userExist.mobileNumber,
        OTP: "",
      };

      if (
        userExist.isAppliedForDistributor &&
        userExist.status !== VerifyStatus.REJECTED
      ) {
        throw new HttpException(
          "Already applied to be a distributor.",
          HttpStatus.OK
        );
      }
      if (userExist.isVerified) {
        throw new HttpException(
          "Cannot apply to be a distributor.",
          HttpStatus.OK
        );
      }
      // if (userExist.status === VerifyStatus.REJECTED) {
      //   throw new HttpException(
      //     "Cannot apply to be a distributor.",
      //     HttpStatus.OK
      //   );
      // }

      if (userExist.userType === Role.DISTRIBUTOR) {
        throw new HttpException(
          "You are already a distributor.",
          HttpStatus.OK
        );
      }

      /**check dob format is valid or not */
      if (!isValidDate(dob)) {
        throw new HttpException(
          "Date must be in YYYY-MM-DD format.",
          HttpStatus.OK
        );
      }

      /**check adhaarCardImage is valid or not */
      if (adhaarCardImage && isvalidUrl(adhaarCardImage) === false) {
        throw new HttpException(
          "Adhaar card photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check panCardImage is valid or not */
      if (panCardImage && isvalidUrl(panCardImage) === false) {
        throw new HttpException(
          "PAN card photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check cancelChequeImage is valid or not */
      if (cancelChequeImage && isvalidUrl(cancelChequeImage) === false) {
        throw new HttpException(
          "Cancel check photo url must be valid url.",
          HttpStatus.OK
        );
      }

      /**check declarationFormPhotoUrl is valid or not */
      if (
        declarationFormPhotoUrl &&
        isvalidUrl(declarationFormPhotoUrl) === false
      ) {
        throw new HttpException(
          "Declaration form photo url must be valid url.",
          HttpStatus.OK
        );
      }

      if (password !== confirmPassword) {
        throw new HttpException(
          `Password and Confirm Password does not match.`,
          HttpStatus.OK
        );
      }

      const hashedPassword = await hash(password, 12);
      if (!hashedPassword) {
        throw new HttpException(
          `Something went wrong with the password.`,
          HttpStatus.OK
        );
      }

      req.body.password = hashedPassword;

      const panCategories = await this.PanCategoryModel.find({
        isActive: true,
      });
      if (!panCategories) {
        throw new HttpException("PAN categories not exist.", HttpStatus.OK);
      }
      const itrCategories = await this.ItrCategoryModel.find({
        isActive: true,
      });
      if (!itrCategories) {
        throw new HttpException("ITR categories not exist.", HttpStatus.OK);
      }
      const allServices = [
        serviceType.DIGITAL_PAN,
        serviceType.DSC,
        serviceType.GUMASTA,
        serviceType.ITR,
        serviceType.MSME,
        serviceType.PAN,
      ];
      const dataToBeUdated = {
        ...req.body,
        sjbtCode: await this.checkProfile.generateSJBTCode(
          name,
          fatherName,
          dob
        ),
        status: "PENDING",
        isAppliedForDistributor: true,
        isProfileComplete: true,
        services: allServices,
        category: {
          panCategories: panCategories.map((item) => item._id),
          itrCategories: itrCategories.map((item) => item._id),
        },
        subscriptionPayment: subscriptionPayment.PENDING,
      };

      /**generate otp */
      const OTP = generateOTP(req);

      /**store otp in otp database */

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userExist._id,
            userType: Role.RETAILER,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: userExist._id,
            userType: Role.RETAILER,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            emailOTP: OTP.emailOTP,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          { upsert: true }
        );
      }
      if (OTP.mobileOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userExist._id,
            userType: Role.RETAILER,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: userExist._id,
            userType: Role.RETAILER,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            mobileOTP: OTP.mobileOTP,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          { upsert: true }
        );
      }

      msg91Data.OTP = OTP.mobileOTP;
      let sendEmailOtp = await this.EmailService.sendEmailOTPTemplate(
        {
          name: req.body.name.toUpperCase(),
          sjbtCode: dataToBeUdated.sjbtCode,
          otp: OTP.emailOTP,
        },
        req.body.email
      );
      if (!sendEmailOtp || !sendEmailOtp["sendStatus"]) {
        console.log("Couldn't send otp on email. Please try again.");
      }

      const msgSent: any = await sendMsg91Function(msg91Data);
      if (!msgSent || !msgSent.sendStatus) {
        throw new HttpException(
          "Couldn't send otp on entered mobile number. Please try again.",
          HttpStatus.OK
        );
      }

      const updateDetails = await this.userModel.findByIdAndUpdate(
        {
          _id: req.userData.Id,
        },
        {
          $set: {
            ...dataToBeUdated,
          },
        },
        {
          new: true,
        }
      );

      if (!updateDetails) {
        throw new HttpException("Unable to regitser.", HttpStatus.OK);
      }

      const userFlowData = updateDetails;
      userFlowData["userId"] = updateDetails._id.toString();
      delete userFlowData._id;

      const updateUserFlow = await new this.UserFlowModel({
        ...userFlowData,
      }).save();

      /**create otptoken */
      const token = await otpToken(
        userExist,
        req,
        Role.RETAILER,
        req.userData.sjbtCode
      );

      //add digitalPan with zero amount
      const createDigitalPan = await this.digitalPanWalletAmt.createWallet(
        requestedId
      );

      this.addLogFunction.logAdd(
        req,
        "",
        "",
        Role.RETAILER,
        "RETAILER_APPLY_FOR_DISTRIBUTOR",
        "",
        true,
        200,
        `RETAILER ${userExist.mobileNumber} registerd at ${currentDate}.`,
        "RETAILER registred successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        status: true,
        message: "Applied successfully, please verify email and mobile!",
        token: token,
        data: {
          userId: userExist._id,
          UserType: Role.RETAILER,
          sjbtCode: req.userData.sjbtCode,
          // OTP: OTP,
        },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        "",
        "",
        Role.RETAILER,
        "RETAILER_APPLY_FOR_DISTRIBUTOR",
        "",
        errData.resData.status,
        errData.statusCode,
        `tried to apply for distributor.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------

  //-------------------------------------------------------------------------
  /***
   *update profile and profile status
   */
  //-------------------------------------------------------------------------

  async retailerUpdate(res: any, req: any) {
    try {
      const {
        name,
        email,
        dob,
        fatherName,
        firmName,
        address,
        area,
        cityVillageName,
        district,
        pincode,
        state,
        declarationFormPhotoUrl,
      } = req.body;

      const reqParams = [
        "name",
        "email",
        "dob",
        "fatherName",
        "firmName",
        "address",
        "area",
        "cityVillageName",
        "district",
        "pincode",
        "state",
        "declarationFormPhotoUrl",
      ];

      const requiredKeys = [
        "name",
        "email",
        "dob",
        "fatherName",
        "address",
        "area",
        "cityVillageName",
        "district",
        "pincode",
        "state",
      ];

      const isValid = await keyValidationCheck(
        req.body,
        reqParams,
        requiredKeys
      );
      if (!isValid.status) {
        return res.status(200).send({
          message: isValid.message,
          status: false,
          code: "BAD_REQUEST",
          issue: "REQUEST_BODY_VALIDATION_FAILED",
          data: null,
        });
      }
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const emailExists = await this.userModel.findOne({
        email: email,
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(req.userData.Id) },
      });
      if (emailExists) {
        throw new HttpException(
          "Another user exist with same email.",
          HttpStatus.OK
        );
      }

      // if (mobileNumber) {
      //   /**check mobile number is valid or not*/
      //   if (!isMobileValid(mobileNumber)) {
      //     throw new HttpException(
      //       'Mobile number must be a valid number.',
      //       HttpStatus.OK,
      //     );
      //   }

      //   const mobileExists = await this.userModel.findOne({
      //     mobileNumber: mobileNumber,
      //     isDeleted: false,
      //     _id: { $ne: new mongoose.Types.ObjectId(req.userData.Id) },
      //   });
      //   if (mobileExists) {
      //     throw new HttpException(
      //       'Another user exist with same mobile number.',
      //       HttpStatus.OK,
      //     );
      //   }
      // }

      /**check email is valid or not */
      if (!isEmailValid(email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      /**check dob format is valid or not */
      if (!isValidDate(dob)) {
        throw new HttpException(
          "Date must be in YYYY-MM-DD format.",
          HttpStatus.OK
        );
      }

      const userExist = await this.userModel.findOne({
        _id: req.userData.Id,
        isActive: true,
        isDeleted: false,
      });

      const userData = {
        email: email,
        // mobileNumber: mobileNumber,
        dob: dob,
        name: dob,
      };

      const checkProfile = await this.checkProfile.checkProfile(userData);

      let updateProfileStatus = false;
      if (userExist.userType === Role.RETAILER) {
        if (!checkProfile.status) {
          updateProfileStatus = false;
        } else {
          updateProfileStatus = true;
        }
      }

      const result = await this.userModel.findByIdAndUpdate(
        { _id: userExist._id },
        {
          $set: {
            name: name,
            email: email,
            // mobileNumber: mobileNumber,
            dob: dob,
            firmName: firmName,
            fatherName: fatherName,
            isProfileComplete: updateProfileStatus,
            address: address,
            area: area,
            cityVillageName: cityVillageName,
            district: district,
            pincode: pincode,
            state: state,
            declarationFormPhotoUrl: declarationFormPhotoUrl,
          },
        },
        { new: true }
      );

      if (!result) {
        throw new HttpException("Unable to regitser.", HttpStatus.OK);
      }

      const userFlowData = result;
      userFlowData["userId"] = result._id.toString();
      delete userFlowData._id;

      const updateUserFlow = await new this.UserFlowModel({
        ...userFlowData,
      }).save();

      await updateUserFlow.save();

      this.addLogFunction.logAdd(
        req,
        "",
        "",
        Role.RETAILER,
        "RETAILER_PROFILE",
        "",
        true,
        200,
        `Retailer ${userExist.mobileNumber} completed profile at ${currentDate}.`,
        "Retailer profile completed successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Profile completed.",
        status: true,
        data: result,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        "",
        "",
        Role.RETAILER,
        "RETAILER_PROFILE",
        "",
        errData.resData.status,
        errData.statusCode,
        `Retailer tried to complete profile.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  /**
   * user's profile
   */
  async user_profile(res: any, req: any) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (req.userData && req.userData.Id) {
        const userExist = await this.userModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
          isBlocked: false,
          isActive: true,
        });
        if (!userExist) {
          throw new HttpException("Retailer not found.", HttpStatus.OK);
        }
        this.addLogFunction.logAdd(
          req,
          requestedId,
          requestedType,
          "RETAILER",
          "RETAILER_PROFILE",
          userExist._id,
          true,
          200,
          `${userExist.userType} ${userExist.name} requested to view profile at ${currentDate}.`,
          "Data found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: "Data found successfully.",
          status: true,
          data: userExist,
          code: "OK",
          issue: null,
        });
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "RETAILER",
        "RETAILER_PROFILE",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to view profile.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
