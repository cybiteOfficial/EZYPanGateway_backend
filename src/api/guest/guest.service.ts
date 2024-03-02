import { Otp, OtpDocument, ValidOtp } from "../otp/entity/create-otp.entity";
import {
  UserFlow,
  UserFlowDocument,
} from "../user-flow/entities/user-flow.entity";
import {
  Role,
  subscriptionPayment,
  User,
  UserDocument,
  VerifyStatus,
} from "../user/entities/user.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as moment from "moment";
import { generateOTP } from "../../helper/otpGenerate.helper";
import { errorRes } from "../../helper/errorRes";
import { checkProfile } from "../../helper/profileComplete";
import {
  isEmailValid,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import { createToken, otpToken } from "../../helper/tokenCreate";
import mongoose from "mongoose";
import { Client } from "../../helper/initRedis";
import { AddLogFunction } from "../../helper/addLog";
import { extractFieldsForUserFlowTable } from "../../helper/changeStatus";
import { isAfter } from "date-fns";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import {
  PanCategory,
  PanCategoryDocument,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategoryDocument,
} from "../itr-category/entities/itr-category.entity";
import { hash } from "bcrypt";
import { serviceType } from "../price-config/entities/price-config.entity";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import { userAuthHelper } from "../../auth/auth.helper";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import { EmailService } from "../../helper/sendEmail";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";

@Injectable()
export class GuestService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(UserFlow.name)
    private readonly UserFlowModel: Model<UserFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
    private readonly sjbtHelper: checkProfile,
    private readonly EmailService: EmailService,
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,
    @InjectModel(PanCategory.name)
    private readonly PanCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(ItrCategory.name)
    private readonly ItrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    private readonly refundWalletAmt: refundWalletAmt,
    private readonly digitalPanWalletAmt: WalletAmt
  ) {}
  //-------------------------------------------------------------------------
  //-------------------------------------------------------------------------
  /***
   * Guest login
   */
  //-------------------------------------------------------------------------
  async guestLogin(req: any, res: any) {
    try {
      const { mobileNumber } = req.body;
      const reqParams = ["mobileNumber"];
      const requiredKeys = ["mobileNumber"];
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

      let msg91Data = {
        template_id: process.env.MSG91_OTP_TEMPLATE_ID,
        sender: process.env.MSG91_SENDER_ID,
        short_url: "0",
        mobiles: "+91" + req.body.mobileNumber,
        otp: "",
      };

      if (req.body.mobileNumber && !isMobileValid(req.body.mobileNumber)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }
      let guestData;
      const userExist = await this.userModel.findOne({
        mobileNumber: req.body.mobileNumber,
        isDeleted: false,
      });

      if (userExist && !userExist.isActive) {
        throw new HttpException(`Your account is under review.`, HttpStatus.OK);
      }

      if (userExist && userExist.isBlocked) {
        throw new HttpException(`Your account is blocked.`, HttpStatus.OK);
      }

      if (userExist && userExist.userType === Role.DISTRIBUTOR) {
        throw new HttpException(
          `Distributor are not allowed to login as a guest.`,
          HttpStatus.OK
        );
      }

      // if (userExist && userExist.userType === Role.RETAILER) {
      //   throw new HttpException(
      //     `Retailer are not allowed to login as a guest.`,
      //     HttpStatus.OK
      //   );
      // }

      const panCategories = await this.PanCategoryModel.find({
        isActive: true,
      });

      if (!panCategories) {
        throw new HttpException(
          "PAN categories does not exist.",
          HttpStatus.OK
        );
      }

      const itrCategories = await this.ItrCategoryModel.find({
        isActive: true,
      });

      if (!itrCategories) {
        throw new HttpException(
          "ITR categories does not exist.",
          HttpStatus.OK
        );
      }
      const allServices = [
        serviceType.DIGITAL_PAN,
        serviceType.DSC,
        serviceType.GUMASTA,
        serviceType.ITR,
        serviceType.MSME,
        serviceType.PAN,
      ];

      if (!userExist) {
        //-----------------add-user-as-guest---------------//
        const newGuestAdded = await new this.userModel({
          mobileNumber: req.body.mobileNumber,
          role: Role.GUEST,
          userType: Role.GUEST,
          services: allServices,
          category: {
            panCategories: panCategories.map((item) => item._id),
            itrCategories: itrCategories.map((item) => item._id),
          },
        }).save();

        if (!newGuestAdded) {
          throw new HttpException(
            `Something went wrong. Unable to login.`,
            HttpStatus.OK
          );
        }

        const createRefundWallet = await this.refundWalletAmt.createWallet(
          req.body.uuid,
          newGuestAdded._id.toString()
        );

        //add digitalPan with zero amount
        const createDigitalPan = await this.digitalPanWalletAmt.createWallet(
          newGuestAdded._id.toString()
        );

        const updatedUserFlowFields = await extractFieldsForUserFlowTable(
          newGuestAdded
        );
        const updateUserFlow = await new this.UserFlowModel({
          userId: newGuestAdded._id,
          ...updatedUserFlowFields,
        }).save();
        guestData = newGuestAdded;
      } else {
        guestData = userExist;
      }

      const tenMinutesLater = moment()
        .utcOffset("+05:30")
        .add(10, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");

      //generate otp

      const OTP = generateOTP(req);
      if (parseInt(mobileNumber) === parseInt(process.env.GUEST_MOBILE)) {
        OTP.mobileOTP = 123456;
      }

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: guestData._id,
            userType: Role.GUEST,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: guestData._id,
            userType: Role.GUEST,
            expiresIn: tenMinutesLater,
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
            userId: guestData._id,
            userType: Role.GUEST,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: guestData._id,
            userType: Role.GUEST,
            expiresIn: tenMinutesLater,
            mobileOTP: OTP.mobileOTP,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          { upsert: true }
        );
      }

      msg91Data.otp = OTP.mobileOTP;

      const msgSent: any = await sendMsg91Function(msg91Data);
      if (!msgSent || !msgSent.sendStatus) {
        throw new HttpException(
          "Couldn't send otp on entered mobile number. Please try again.",
          HttpStatus.OK
        );
      }

      const token = await otpToken(guestData, req, "GUEST", "");

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "GUEST",
        "GUEST_LOGIN",
        guestData._id,
        true,
        200,
        `${guestData.userType} ${guestData.mobileNumber} requested to login ${currentDate}.`,
        "Successfull!. Please verify OTP.",
        req.socket.remoteAddress
      );

      return res.status(200).send({
        status: true,
        message: "Successfull!. Please verify OTP.",
        token: token,
        data: {
          userId: guestData._id,
          mobileNumber: guestData.mobileNumber,
          UserType: Role.GUEST,
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
        "GUEST",
        "GUEST_LOGIN",
        "",
        errData.resData.status,
        errData.statusCode,
        `Guest tried to login with ${req.body.mobileNumber}.`,
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

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

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
      const tokenType = req.otpData.token_type;

      const userExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
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

      const otpFound = await this.otpModel.findOne({
        userId: userId,
        [otpKey]: otp,
        userType: otpUserType,
        isOtpUsed: false,
        otpType: otpType,
      });

      if (!otpFound) {
        throw new HttpException(`Invalid otp.`, HttpStatus.OK);
      }
      otp_id = otpFound._id.toString();

      const istokenExpired = isAfter(new Date(), new Date(otpFound.expiresIn));

      if (istokenExpired) {
        throw new HttpException(
          `Otp expired. Please try again.`,
          HttpStatus.OK
        );
      }

      let updateUserData;
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
        const updateDistributorData = await this.userModel.findOneAndUpdate(
          { _id: userId },
          { [keyToUpdate]: true },
          { new: true }
        );

        updateUserData = updateDistributorData;

        const userFlowData = updateUserData;
        userFlowData["userId"] = userId;
        delete userFlowData._id;
        const updatedUserFlow = await new this.UserFlowModel({
          ...userFlowData,
        }).save();
      }
      //---------create-token---------//

      const userType = userExist.userType;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;

      const token = await createToken(userExist, req.otpData.type, "");

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
              otpUserType,
              userId,
              "GUEST",
              "GUEST_OTP_VERIFY",
              userId,
              true,
              200,
              `${otpUserType} ${req.otpData.contactNumber} verified OTP at ${currentDate}.`,
              "Login successfully.",
              req.socket.remoteAddress
            );
            return res.status(200).send({
              status: true,
              message: "Login successfull.!",
              token: token,
              data: {
                userType: req.otpData.type,
                mobileNumber: req.otpData.mobileNumber,
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
        "GUEST",
        "GUEST_OTP_VERIFY",
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
        "userType",
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
        $and: [{ isDeleted: false }, { userType: "GUEST" }],
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
      const booleanFields = [];
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
          "GUESTS"
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
          "GUEST",
          "GUEST_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data to view guest at ${currentDate}.`,
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
        "GUEST",
        "GUEST_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data for view guest with this credentials at ${moment()
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
   * find guest
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const query = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        userType: "GUEST",
      };
      const userFound = await this.userModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $unset: ["password", "__v"],
        },
      ]);
      if (!userFound.length) {
        throw new HttpException("Guest not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "GUEST",
        "GUEST_VIEW",
        id,
        true,
        200,
        `${requestedType} ${userFound[0].mobileNumber} view guest ${id} at ${currentDate}.`,
        "Guest found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Guest found successfully.",
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
        "GUEST",
        "GUEST_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view guest ${id} with this credentials at ${moment()
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
          { userType: Role.GUEST, mobileNumber: searchValue, isDeleted: false },
          { _id: 1, mobileNumber: 1 }
        );
      } else {
        dataFound = await this.userModel.find(
          { userType: Role.GUEST, isDeleted: false },
          { _id: 1, mobileNumber: 1 }
        );
      }
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "GUEST",
        "GUEST_LIST",
        "",
        true,
        200,
        `${requestedType} check list of guest at ${currentDate}.`,
        "Guest found successfully.",
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
        "GUEST",
        "GUEST_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of guest with this credentials at ${moment()
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
        throw new HttpException(`Guest not found.`, HttpStatus.OK);
      }

      const activeKey = userFound.isBlocked === true ? false : true;
      const keyValue = activeKey === true ? "BLOCK" : "UNBLOCK";

      const result = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isBlocked: activeKey } },
        { new: true }
      );

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);
      const userIdInFlowTable = result._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userIdInFlowTable,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      const tokenKey = `${userIdInFlowTable}*`;

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
          "GUEST",
          "GUEST_BLOCK_USER",
          id,
          true,
          200,
          `${requestedType} ${keyValue} user ${userFound.mobileNumber} at ${currentDate}.`,
          `${keyValue} guest successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Guest's account ${keyValue} successfully.`,
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
        "GUEST",
        "GUEST_BLOCK_USER",
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

  async applyFoDistributor(req: any, res: any) {
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
      ];

      const requiredKeys = [
        "name",
        "dob",
        "fatherName",
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
      const userId = req.userData.Id;
      const userExist = await this.userModel.findOne({
        _id: userId,
        isDeleted: false,
        isBlocked: false,
        isActive: true,
      });
      if (!userExist) {
        throw new HttpException("User not found.", HttpStatus.OK);
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
      if (
        userExist.userType === Role.DISTRIBUTOR ||
        userExist.role === Role.DISTRIBUTOR
      ) {
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

      /**check pan card number is valid or not */
      if (panNumber && !isPanValid(panNumber)) {
        throw new HttpException(
          "PAN card number must be a valid number.",
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

      /**check email is valid or not */
      if (email && email !== "") {
        if (!isEmailValid(email)) {
          throw new HttpException("Invalid email Id.", HttpStatus.OK);
        }
        const emailExists = await this.userModel.findOne({
          email: email,
          isDeleted: false,
          _id: { $ne: userId },
        });
        if (emailExists) {
          throw new HttpException(
            "Another user exist with same email.",
            HttpStatus.OK
          );
        }
      }

      /**check mobile number is valid or not*/

      if (mobileNumber && mobileNumber !== "") {
        if (!isMobileValid(mobileNumber)) {
          throw new HttpException(
            "Mobile number must be a valid number.",
            HttpStatus.OK
          );
        }
        const mobileExists = await this.userModel.findOne({
          mobileNumber: mobileNumber,
          isDeleted: false,
          _id: { $ne: userId },
        });
        if (mobileExists) {
          throw new HttpException(
            "Another user exist with same mobile number.",
            HttpStatus.OK
          );
        }
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
        sjbtCode: await this.sjbtHelper.generateSJBTCode(name, fatherName, dob),
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
      const updateDetails = await this.userModel.findByIdAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            ...dataToBeUdated,
          },
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

      //generate otp
      const OTP = generateOTP(req);

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userExist._id,
            userType: Role.GUEST,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: userExist._id,
            userType: Role.GUEST,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            emailOTP: OTP.emailOTP,
            otpType: ValidOtp.EMAIL,
          },
          { upsert: true }
        );
      }
      if (OTP.mobileOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userExist._id,
            userType: Role.GUEST,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: userExist._id,
            userType: Role.GUEST,
            expiresIn: moment()
              .utcOffset("+05:30")
              .add(10, "minutes")
              .format("YYYY-MM-DD HH:mm:ss"),
            mobileOTP: OTP.mobileOTP,
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
      if (!sendEmailOtp) {
        console.log("Couldn't send otp on email. Please try again.");
      }

      const msgSent: any = await sendMsg91Function(msg91Data);
      if (!msgSent || !msgSent.sendStatus) {
        throw new HttpException(
          "Couldn't send otp on entered mobile number. Please try again.",
          HttpStatus.OK
        );
      }

      const token = await otpToken(
        userExist,
        req,
        req.userData.type,
        ""
        // userExist.sjbtCode
      );

      //add digitalPan with zero amount
      const createDigitalPan = await this.digitalPanWalletAmt.createWallet(
        userId
      );

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "GUEST",
        "APPLY_FOR_DISTRIBUTOR",
        userExist._id,
        true,
        200,
        `${requestedType} ${userExist.mobileNumber} applied to become distributor at ${currentDate}.`,
        "Distributor request taken successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        status: true,
        message: "Distributor request taken successfully!",
        token: token,
        data: {
          userId: userExist._id,
          UserType: Role.GUEST,
          // sjbtCode: userExist.sjbtCode,
          sjbtCode: "",
          // OTP: OTP,
        },
        code: "OK",
        issue: null,
      });
    } catch (err) {
      /**
       * TODO: log data
       * log data to be sent into function
       * request
       * userType( to find user)
       * userId( to find user)
       * request( for requested data)
       * module( To find module)
       * response status( true/false)
       * status code( code eg. 200(OK))
       * remark (to understand type of request)
       * message (response message sent)
       */

      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "GUEST",
        "APPLY_FOR_DISTRIBUTOR",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          req.userData?.mobileNumber || ""
        } tried to apply for distributor.`,
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
          throw new HttpException("Guest not found.", HttpStatus.OK);
        }
        this.addLogFunction.logAdd(
          req,
          requestedId,
          requestedType,
          "GUEST",
          "GUEST_PROFILE",
          userExist._id,
          true,
          200,
          `${userExist.userType} ${userExist.name} requested to profile at ${currentDate}.`,
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
        "GUEST",
        "GUEST_PROFILE",
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
