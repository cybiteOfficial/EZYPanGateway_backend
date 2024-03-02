import { DistributorRetailerDocument } from "./../distributor-retailers/entities/distributor-retailers.entity";
import {
  User,
  UserDocument,
  Role,
  VerifyStatus,
  subscriptionPayment,
} from "../user/entities/user.entity";
import { Otp, OtpDocument, ValidOtp } from "../otp/entity/create-otp.entity";
import {
  UserFlow,
  UserFlowDocument,
} from "../user-flow/entities/user-flow.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { compare } from "bcrypt";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { createToken, otpToken } from "../../helper/tokenCreate";
import mongoose from "mongoose";
import { ChangeStatusDto, CreateUserDto } from "../user/dto/create-user.dto";
import {
  changestatusForUser,
  extractFieldsForUserFlowTable,
} from "../../helper/changeStatus";
import { Client } from "../../helper/initRedis";
import { AddLogFunction } from "../../helper/addLog";
import {
  isEmailValid,
  isMobileValid,
  isPanValid,
  isValidDate,
  isValidPassword,
  isvalidUrl,
} from "../../helper/basicValidation";
import { generateOTP } from "../../helper/otpGenerate.helper";
import {
  PanCategory,
  PanCategoryDocument,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategoryDocument,
} from "../itr-category/entities/itr-category.entity";
import { hash } from "bcrypt";
import { isAfter } from "date-fns";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { serviceType } from "../price-config/entities/price-config.entity";
import { checkProfile } from "../../helper/profileComplete";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import { userAuthHelper } from "../../auth/auth.helper";
import * as bcrypt from "bcrypt";
import {
  SubscriptionFlow,
  SubscriptionFlowDocument,
} from "../subscription-flow/entities/subscription-flow.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import {
  EmailTemplate,
  EmailTemplateDocument,
} from "../../api/email-templates/entities/email-template.module";

import { EmailService } from "../../helper/sendEmail";
import { smsTemplateService } from "../../helper/smsTemplates";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
import { paymentStatus } from "../transaction/entities/transaction.entity";
import { DistributorRetailers } from "../distributor-retailers/entities/distributor-retailers.entity";
import { WhatsappMsgService } from "./../../helper/sendWhatsApp";

@Injectable()
export class DistributorService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
    private readonly refundWalletAmt: refundWalletAmt,
    private readonly digitalPanWalletAmt: WalletAmt,
    private readonly sjbthelper: checkProfile,
    private readonly EmailService: EmailService,
    private readonly smsTemplateService: smsTemplateService,
    private readonly WhatsappMsgService: WhatsappMsgService,
    @InjectModel(UserFlow.name)
    private readonly UserFlowModel: Model<UserFlowDocument>,
    @InjectModel(EmailTemplate.name)
    private readonly EmailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,
    @InjectModel(PanCategory.name)
    private readonly PanCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(ItrCategory.name)
    private readonly ItrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(RefundWallet.name)
    private readonly RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(SubscriptionFlow.name)
    private readonly SubscriptionFlowModel: Model<SubscriptionFlowDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(DistributorRetailers.name)
    private distributorRetailersModel: Model<DistributorRetailerDocument>
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create distributor
   */
  //-------------------------------------------------------------------------

  async register(CreateUserDto: CreateUserDto, res, req) {
    try {
      const {
        name,
        email,
        mobileNumber,
        dob,
        address,
        adhaarCardImage,
        panCardImage,
        cancelChequeImage,
        password,
        confirmPassword,
        panNumber,
        fatherName,
        firmName,
        area,
        cityVillageName,
        pincode,
        district,
        state,
        declarationFormPhotoUrl,
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
        "state",
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
        "fatherName",
        "firmName",
        "area",
        "cityVillageName",
        "district",
        "pincode",
        "state",
        "declarationFormPhotoUrl",
      ];

      const requiredKeys = [
        "name",
        "dob",
        "fatherName",
        "address",
        "area",
        "state",
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

      const emailExists = await this.userModel.findOne({
        email: email,
        isActive: true,
        isBlocked: false,
        isDeleted: false,
      });
      if (emailExists) {
        throw new HttpException(
          "Another user exist with same email.",
          HttpStatus.OK
        );
      }

      const mobileExists = await this.userModel.findOne({
        mobileNumber: mobileNumber,
        isActive: true,
        isBlocked: false,
        isDeleted: false,
      });
      if (mobileExists) {
        throw new HttpException(
          "Another user exist with same mobile number.",
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
        CreateUserDto.declarationFormPhotoUrl &&
        isvalidUrl(CreateUserDto.declarationFormPhotoUrl) === false
      ) {
        throw new HttpException(
          "Declaration form photo url must be valid url.",
          HttpStatus.OK
        );
      }

      if (!isValidPassword(CreateUserDto.password).status) {
        throw new HttpException(
          isValidPassword(CreateUserDto.password).Msg,
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
      CreateUserDto.password = hashedPassword;

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

      const newUserAdded = await new this.userModel({
        ...req.body,
        email: req.body.email,
        sjbtCode: await this.sjbthelper.generateSJBTCode(name, fatherName, dob),
        userType: Role.GUEST,
        role: Role.GUEST,
        services: allServices,
        category: {
          panCategories: panCategories.map((item) => item._id),
          itrCategories: itrCategories.map((item) => item._id),
        },
        status: VerifyStatus.PENDING,
        isProfileComplete: true,
        subscriptionPayment: subscriptionPayment.PENDING,
      }).save();

      if (!newUserAdded) {
        throw new HttpException(
          "Unable to regitser.Please try again.",
          HttpStatus.OK
        );
      }

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(
        newUserAdded
      );
      const updateUserFlow = await new this.UserFlowModel({
        userId: newUserAdded._id,
        ...updatedUserFlowFields,
      }).save();

      const tenMinutesLater = moment()
        .utcOffset("+05:30")
        .add(10, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");

      //generate otp
      const OTP = generateOTP(req);

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: newUserAdded._id,
            userType: newUserAdded.userType,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: newUserAdded._id,
            userType: newUserAdded.userType,
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
            userId: newUserAdded._id,
            userType: newUserAdded.userType,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: newUserAdded._id,
            userType: newUserAdded.userType,
            expiresIn: tenMinutesLater,
            mobileOTP: OTP.mobileOTP,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          { upsert: true }
        );
      }

      msg91Data.otp = OTP.mobileOTP;

      let sendEmailOtp = await this.EmailService.sendEmailOTPTemplate(
        {
          name: req.body.name,
          sjbtCode: newUserAdded.sjbtCode,
          otp: OTP.emailOTP,
        },
        req.body.email
      );
      // if (!sendEmailOtp || !sendEmailOtp['sendStatus']) {
      //   throw new HttpException(
      //     "Couldn't send otp on email. Please try again.",
      //     HttpStatus.OK,
      //   );
      // }

      const msgSent: any = await sendMsg91Function(msg91Data);

      if (!msgSent || !msgSent.sendStatus) {
        throw new HttpException(
          "Couldn't send otp on entered mobile number. Please try again.",
          HttpStatus.OK
        );
      }

      // let distributorRegisterMsg = {
      //   template_id: process.env.MSG91_DISTRIBUTOR_REGISTER_TEMPLATE_ID,
      //   sender: process.env.MSG91_SENDER_ID,
      //   short_url: '0',
      //   mobiles: '+91' + req.body.mobileNumber,
      //   USERNAME: newUserAdded.name,
      //   SJBTCODE: newUserAdded.sjbtCode,
      // };

      // const sendMsg: any = await sendMsg91Function(distributorRegisterMsg);

      // if (!sendMsg || !sendMsg.sendStatus) {
      //   console.log(sendMsg);
      // }

      const token = await otpToken(
        newUserAdded,
        req,
        newUserAdded.userType,
        newUserAdded.sjbtCode
      );

      const userId = newUserAdded._id.toString();
      //add refund wallet with zero amount
      const createRefundWallet = await this.refundWalletAmt.createWallet(
        req.body.uuid,
        userId
      );

      //add digitalPan with zero amount
      const createDigitalPan = await this.digitalPanWalletAmt.createWallet(
        userId
      );

      this.addLogFunction.logAdd(
        req,
        "",
        "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_ADD",
        newUserAdded._id,
        true,
        200,
        `${newUserAdded.userType} ${newUserAdded.sjbtCode} registerd at ${currentDate}.`,
        "User registred successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "User registered successfully.",
        token: token,
        data: newUserAdded,
        // emailOTP: OTP.emailOTP,
        // mobileOTP: OTP.mobileOTP,
        status: true,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        "",
        "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `User tried to registered with this credentials at ${moment()
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
   * Distrubutor login
   */

  //-------------------------------------------------------------------------
  async distributorLogin(req, res) {
    try {
      if (!req.headers.deviceid) {
        return res.status(200).send({
          message: "Device Id is required.",
          code: "DEVICE_ID_NOT_FOUND.",
          issue: "DEVICE_ID_REQUIRED",
          status: false,
        });
      }

      const userExist = await this.userModel.findOne({
        $or: [
          { sjbtCode: req.body.userName },
          { email: req.body.userName.toLowerCase() },
          { mobileNumber: req.body.userName },
        ],
        isDeleted: false,
      });
      if (!userExist) {
        throw new HttpException(`Distributor not found.`, HttpStatus.OK);
      }
      if (!userExist.isActive) {
        throw new HttpException(
          `Your profile is under review. Please login once it approve.`,
          HttpStatus.OK
        );
      }
      if (userExist.userType !== Role.DISTRIBUTOR) {
        throw new HttpException(
          `Your profile is not verified as a Distributor. Please login as a guest.`,
          HttpStatus.OK
        );
      }
      if (!userExist.isVerified) {
        throw new HttpException(
          `Distributor verification pending. Till than You can login as a guest.`,
          HttpStatus.OK
        );
      }
      if (!userExist.isActive) {
        throw new HttpException(`Your account is under review.`, HttpStatus.OK);
      }
      // if (!userExist.emailVerified) {
      //   throw new HttpException(`Email ID not verified.`, HttpStatus.OK);
      // }
      // if (!userExist.mobileNumberVerified) {
      //   throw new HttpException(`Mobile No. is not verified.`, HttpStatus.OK);
      // }
      if (userExist.isBlocked) {
        throw new HttpException(`Your account is Blocked.`, HttpStatus.OK);
      }
      if (userExist.status == VerifyStatus.REJECTED) {
        throw new HttpException(`Your account is rejected.`, HttpStatus.OK);
      }

      const checkUserSubscription =
        await this.userAuthHelper.checkUserSubscription(
          userExist.subscriptionId,
          userExist.subscriptionPlanExpiryDate,
          userExist.subscriptionType
        );

      // if (!checkUserSubscription) {
      //   return res.status(200).send({ ...checkUserSubscription.resToSend });
      // }

      const password = userExist.password;

      const hashedPassword = await compare(req.body.password, password);

      if (!hashedPassword) {
        throw new HttpException(`Invalid password`, HttpStatus.OK);
      }

      //-----------add-logs-----------//
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userId = userExist._id.toString();
      const userType = userExist.userType;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;

      const token = await createToken(
        userExist,
        userExist.userType,
        userExist.sjbtCode
      );

      const tokenString = `${token.accessToken}${process.env.TOKEN_KEY}${token.refreshToken}`;

      Client.SET(
        userDetails,
        tokenString,
        "EX",
        365 * 24 * 60 * 60,
        (err: any, result: any) => {
          if (err) {
            throw new HttpException("Something went wrong.", HttpStatus.OK);
          } else {
            this.addLogFunction.logAdd(
              req,
              userExist.userType,
              userExist._id,
              "DISTRIBUTOR",
              "DISTRIBUTOR_LOGIN",
              userExist._id,
              true,
              200,
              `${userExist.userType} ${userExist.sjbtCode} login at ${currentDate}.`,
              "Login successfully!",
              req.socket.remoteAddress
            );
            return res.status(200).send({
              status: true,
              message: "Login successfully.!",
              token: token,
              data: {
                userName: userExist.name,
                email: userExist.email,
                mobileNumber: userExist.mobileNumber,
                userType: userExist.userType,
                sjbtCode: userExist.sjbtCode,
                isSubscriptionTaken:
                  userExist.subscriptionTxnStatus == paymentStatus.SUCCESS
                    ? true
                    : false,
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
        "",
        "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_LOGIN",
        "",
        errData.resData.status,
        errData.statusCode,
        `USER ${
          req.body.userName
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

      const userFoundType =
        userExist && userExist.userType === "DISTRIBUTOR"
          ? "DISTRIBUTOR"
          : otpUserType;

      const userType = userFoundType;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;

      const token = await createToken(
        updateUserData,
        userFoundType,
        // userExist.sjbtCode,
        ""
      );

      const tokenString = `${token.accessToken}${process.env.TOKEN_KEY}${token.refreshToken}`;

      Client.SET(
        userDetails,
        tokenString,
        "EX",
        365 * 24 * 60 * 60,
        (err, result) => {
          if (err) {
            throw new HttpException("Something went wrong.", HttpStatus.OK);
          }
          this.addLogFunction.logAdd(
            req,
            otpUserType,
            userId,
            `${otpUserType}`,
            `${otpUserType}OTP_VERIFY`,
            userId,
            true,
            200,
            `${otpUserType} ${userExist.mobileNumber} verified OTP at ${currentDate}.`,
            "Verified successfully.",
            req.socket.remoteAddress
          );
          return res.status(200).send({
            message: "Verified successfully.",
            token: token,
            data: {
              userType: userFoundType,
              mobileNumber: req.otpData.mobileNumber,
              isProfileComplete: userExist.isProfileComplete,
              redirectTo:
                userExist.subscriptionPayment === subscriptionPayment.PENDING
                  ? "Buy subscription page"
                  : null,
            },
            status: true,
            code: "OK",
            issue: null,
          });
        }
      );
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.otpData?.type || "",
        req.otpData?.Id || "",
        `${req.otpData.type}`,
        `${req.otpData.type}OTP_VERIFY`,
        `${req.otpData.Id}`,
        errData.resData.status,
        errData.statusCode,
        `${req.otpData?.type || ""} ${
          req.otpData?.Id || ""
        } tried to verified otp with this credentials at ${moment()
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
        "email",
        "mobileNumber",
        "dob",
        "status",
        "sjbtCode",
        "userType",
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
        $and: [
          { isDeleted: false },
          {
            $or: [
              { userType: "DISTRIBUTOR" },
              { isAppliedForDistributor: true },
              { status: VerifyStatus.PENDING },
              { status: VerifyStatus.REJECTED },
              { status: VerifyStatus.VERIFIED },
            ],
          },
        ],
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
      const numberFileds = ["pincode"];

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
          "DISTRIBUTORS"
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
          "DISTRIBUTOR",
          "DISTRIBUTOR_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data for view distributors at ${currentDate}.`,
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
        "DISTRIBUTOR",
        "DISTRIBUTOR_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter distributor data with this credentials at ${moment()
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
   * retailers pagination
   */
  //-------------------------------------------------------------------------
  async RetailersList(req, res) {
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
        "firmName",
        "retailerName",
        "mobileNumber",
        "retailerId",
        "sjbtCode",
        "loginDate",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const matchQuery: { $and: any[] } = {
        $and: [
          { isDeleted: false },
          //  { distributorId: req.userData.Id }
        ],
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
        orderBy = "loginDate";
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
      const booleanFields = ["isDeleted"];
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

      const allowedDateFiletrKeys = ["createdAt", "updatedAt", "loginDate"];
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
          dateFilter.dateFilterKey = "loginDate";
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

      const additionaQuery = [
        {
          $match: {
            isDeleted: false,
            "allDistributor.distributorId": new mongoose.Types.ObjectId(
              req.userData.Id
            ),
          },
        },
        {
          $addFields: {
            retailerId: { $toString: "$_id" },
          },
        },
        {
          $lookup: {
            from: "distributorretailers",
            localField: "retailerId",
            foreignField: "retailerId",
            as: "retailers",
            pipeline: [
              {
                $match: {
                  distributorId: req.userData.Id,
                  isDeleted: false,
                },
              },
            ],
          },
        },

        {
          $addFields: {
            retailerName: "$name",
            firmName: "$firmName",
            mobileNumber: "$mobileNumber",
          },
        },
        {
          $addFields: {
            distributorId: { $arrayElemAt: ["$retailers.distributorId", 0] },
            retailerId: { $arrayElemAt: ["$retailers.retailerId", 0] },
            sjbtCode: { $arrayElemAt: ["$retailers.sjbtCode", 0] },
            loginDate: { $arrayElemAt: ["$retailers.loginDate", 0] },
          },
        },
        {
          $project: {
            retailerName: 1,
            retailers: 1,
            firmName: 1,
            mobileNumber: 1,
            distributorId: 1,
            retailerId: 1,
            sjbtCode: 1,
            loginDate: 1,
            isDeleted: 1,
          },
        },
        {
          $unwind: "$retailers",
        },
        {
          $unset: "retailers",
        },
      ];
      // const additionaQuery = [
      //   {
      //     $addFields: {
      //       retailer_id: { $toObjectId: "$retailerId" },
      //     },
      //   },

      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "retailer_id",
      //       foreignField: "_id",
      //       as: "retailers",
      //       pipeline: [
      //         {
      //           $match: {
      //             isDeleted: false,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $addFields: {
      //       retailerName: { $arrayElemAt: ["$retailers.name", 0] },
      //       firmName: { $arrayElemAt: ["$retailers.firmName", 0] },
      //       mobileNumber: { $arrayElemAt: ["$retailers.mobileNumber", 0] },
      //     },
      //   },
      //   {
      //     $unset: "retailers",
      //   },
      // ];

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
          "DISTRIBUTORS"
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
          "DISTRIBUTOR",
          "DISTRIBUTOR_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data for view distributors at ${currentDate}.`,
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
      console.log(err);
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter distributor data with this credentials at ${moment()
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
   * find distributor
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = [];
      const matchQuery = query.push({
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
      });

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "DISTRIBUTORS"
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
      const userFound = await this.userModel.aggregate(query);

      if (!userFound.length) {
        throw new HttpException("Distributor not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DISTRIBUTOR",
        "DISTRIBUTOR_VIEW",
        id,
        true,
        200,
        `${requestedType} ${userFound[0].sjbtCode} view distributor ${id} at ${currentDate}.`,
        "Distributor found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Distributor found successfully.",
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
        "DISTRIBUTOR",
        "DISTRIBUTOR_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to view distributor ${id} with this credentials at ${moment()
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
   * update all status of application
   */
  //-------------------------------------------------------------------------
  async updateStatus(
    id: string,
    changeStatusDto: ChangeStatusDto,
    res,
    req,
    file: Express.Multer.File
  ) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (req.body.requestedStatus == VerifyStatus.PENDING) {
        throw new HttpException(
          `Cannot change status to pending status.`,
          HttpStatus.OK
        );
      }

      const userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });
      if (!userFound) {
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }
      const userId = userFound._id.toString();
      const currentstatus = userFound.status;

      const activeStatus = changestatusForUser(
        currentstatus,
        changeStatusDto.requestedStatus
      );

      if (!activeStatus) {
        throw new HttpException(`Could not update status.`, HttpStatus.OK);
      }

      let dataToBeUpdated;
      let imagePath;
      if (req.file !== undefined) {
        const path_array = req.file.path.split("public");
        req.file.path = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;
        imagePath = req.file.path;
      }

      if (activeStatus === VerifyStatus.VERIFIED) {
        dataToBeUpdated = {
          status: activeStatus,
          isVerified: true,
          role: Role.DISTRIBUTOR,
          userType: Role.DISTRIBUTOR,
          declarationFormPhotoUrl: imagePath,
        };

        /**send sms of distributor registor */
        let distributorRegisterMsg = {
          template_id: process.env.MSG91_DISTRIBUTOR_REGISTER_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID,
          short_url: "0",
          mobiles: "+91" + userFound.mobileNumber,
          USERNAME: userFound.name,
          SJBTCODE: userFound.sjbtCode,
        };

        const sendMsg: any = await sendMsg91Function(distributorRegisterMsg);

        if (!sendMsg || !sendMsg.sendStatus) {
          console.log(sendMsg);
        }

        /**send email when distributor is verified */
        let registrationEmail =
          await this.EmailService.sendEmailRegistrationTemplate(
            {
              name: userFound.name.toUpperCase(),
              sjbtCode: userFound.sjbtCode,
            },
            userFound.email
          );

        if (!registrationEmail) {
          console.log("email not sent");
        }

        /**send whatsapp msg***/
        let parameters = [
          {
            type: "text",
            text: userFound.name,
          },
          {
            type: "text",
            text: userFound.sjbtCode,
          },
        ];

        let sendWhatsappMsg =
          await this.WhatsappMsgService.sendWhatsAppMsg91Function(
            userFound.mobileNumber,
            "USER_REGISTRATION",
            parameters,
            false
          );
      } else {
        dataToBeUpdated = {
          status: activeStatus,
          rejectionReason: req.body.rejectionReason,
        };
      }

      const remark = `${req.userData.type} ${req.userData.contactNumber} updated ${dataToBeUpdated.userType} ${dataToBeUpdated.sjbtCode} with ${req.body.requestedStatus} status at ${currentDate}`;

      const result = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { ...dataToBeUpdated } },
        { new: true }
      );

      if (result.status == VerifyStatus.VERIFIED) {
        const tokenKey = `${userId}*`;
        // const userDetails = userId + adminType + deviceId;

        Client.KEYS(tokenKey, async (err: any, keys: any) => {
          if (err) {
            console.log("Some error occurred", err);
          }

          if (!keys || keys.length === 0) {
            console.log("No keys found.");
          }

          const deletePromises = keys.map((key: any) => Client.DEL(key));
          await Promise.all(deletePromises);
        });
      }

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DISTRIBUTOR",
        "DISTRIBUTOR_UPDATE_STATUS",
        id,
        true,
        200,
        remark,
        "Distributor status updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: `Changed status to ${activeStatus} successfully.`,
        status: true,
        data: null,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_UPDATE_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update status ${id} with this credentials at ${moment()
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
        throw new HttpException(`Distributor not found.`, HttpStatus.OK);
      }

      const activeKey = userFound.isBlocked === true ? false : true;
      const keyValue = activeKey === true ? "BLOCK" : "UNBLOCK";

      const result = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isBlocked: activeKey } },
        { new: true }
      );

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);
      const userId = result._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

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
          "DISTRIBUTOR",
          "DISTRIBUTOR_BLOCK_UNBLOCK",
          id,
          true,
          200,
          `${requestedType} ${userFound.sjbtCode} blocked distributor ${id} at ${currentDate}.`,
          `Distributor ${keyValue} successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Distributor's account ${keyValue} successfully.`,
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
        "DISTRIBUTOR",
        "DISTRIBUTOR_BLOCK_UNBLOCK",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to block distributor ${id} with this credentials at ${moment()
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
   * find all distributor
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
          { userType: Role.DISTRIBUTOR, name: searchValue, isDeleted: false },
          { _id: 1, mobileNumber: 1, name: 1, sjbtCode: 1 }
        );
      } else {
        dataFound = await this.userModel.find(
          { userType: Role.DISTRIBUTOR, isDeleted: false },
          { _id: 1, mobileNumber: 1, name: 1, sjbtCode: 1 }
        );
      }

      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedId,
        requestedType,
        "DISTRIBUTOR",
        "DISTRIBUTOR_LIST",
        "",
        true,
        200,
        `${requestedType} check list for view distributor at ${currentDate}.`,
        "Data found successfully.",
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
        "DISTRIBUTOR",
        "DISTRIBUTOR_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to check distributor list with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /**
   * user's profile
   */
  //-------------------------------------------------------------------------

  async user_profile(res: any, req: any) {
    try {
      const reqData = req;
      const userData = req.userData;

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userExist = await this.userModel.aggregate([
        {
          $match: {
            userType: Role.RETAILER,
            isDeleted: false,
            isActive: true,
            allDistributor: {
              $elemMatch: {
                distributorId: new mongoose.Types.ObjectId(req.userData.Id),
                sjbtCode: req.userData.sjbtCode,
              },
            },
          },
        },
        {
          $facet: {
            exists: [
              {
                $project: {
                  _id: 0,
                  retailerName: "$name",
                  firmName: "$firmName",
                  mobileNumber: "$mobileNumber",
                  createdAt: "$createdAt",
                  updatedAt: "$updatedAt",
                },
              },
            ],
            nonExists: [], // Empty array if no documents match
          },
        },
        {
          $project: {
            retailers: {
              $cond: {
                if: { $gt: [{ $size: "$exists" }, 0] },
                then: "$exists",
                else: "$nonExists",
              },
            },
          },
        },
        {
          $addFields: {
            userId: { $toObjectId: req.userData.Id },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "Distributor",
            pipeline: [
              {
                $match: {
                  $and: [
                    { userType: Role.DISTRIBUTOR },
                    { isBlocked: false },
                    {
                      isDeleted: false,
                    },
                    { isActive: true },
                  ],
                },
              },
            ],
          },
        },
        {
          $addFields: {
            _id: { $arrayElemAt: ["$Distributor._id", 0] },
            name: { $arrayElemAt: ["$Distributor.name", 0] },
            email: { $arrayElemAt: ["$Distributor.email", 0] },
            mobileNumber: { $arrayElemAt: ["$Distributor.mobileNumber", 0] },
            dob: { $arrayElemAt: ["$Distributor.dob", 0] },
            fatherName: { $arrayElemAt: ["$Distributor.fatherName", 0] },
            firmName: { $arrayElemAt: ["$Distributor.firmName", 0] },
            address: { $arrayElemAt: ["$Distributor.address", 0] },
            area: { $arrayElemAt: ["$Distributor.area", 0] },
            cityVillageName: {
              $arrayElemAt: ["$Distributor.cityVillageName", 0],
            },
            district: { $arrayElemAt: ["$Distributor.district", 0] },
            pincode: { $arrayElemAt: ["$Distributor.pincode", 0] },
            state: { $arrayElemAt: ["$Distributor.state", 0] },
            adhaarCardImage: {
              $arrayElemAt: ["$Distributor.adhaarCardImage", 0],
            },
            panCardImage: { $arrayElemAt: ["$Distributor.panCardImage", 0] },
            cancelChequeImage: {
              $arrayElemAt: ["$Distributor.cancelChequeImage", 0],
            },
            declarationFormPhotoUrl: {
              $arrayElemAt: ["$Distributor.declarationFormPhotoUrl", 0],
            },
            sjbtCode: { $arrayElemAt: ["$Distributor.sjbtCode", 0] },
            panNumber: { $arrayElemAt: ["$Distributor.panNumber", 0] },
            userType: { $arrayElemAt: ["$Distributor.userType", 0] },
            status: { $arrayElemAt: ["$Distributor.status", 0] },
            role: { $arrayElemAt: ["$Distributor.role", 0] },
            isProfileComplete: {
              $arrayElemAt: ["$Distributor.isProfileComplete", 0],
            },
            isActive: { $arrayElemAt: ["$Distributor.isActive", 0] },
            isDeleted: { $arrayElemAt: ["$Distributor.isDeleted", 0] },
            isVerified: { $arrayElemAt: ["$Distributor.isVerified", 0] },
            isBlocked: { $arrayElemAt: ["$Distributor.isBlocked", 0] },
            emailVerified: { $arrayElemAt: ["$Distributor.emailVerified", 0] },
            isAppliedForDistributor: {
              $arrayElemAt: ["$Distributor.isAppliedForDistributor", 0],
            },
            mobileNumberVerified: {
              $arrayElemAt: ["$Distributor.mobileNumberVerified", 0],
            },
            category: { $arrayElemAt: ["$Distributor.category", 0] },
            services: { $arrayElemAt: ["$Distributor.services", 0] },
            subscriptionPayment: {
              $arrayElemAt: ["$Distributor.subscriptionPayment", 0],
            },
            subscriptionPlanExpiryDate: {
              $arrayElemAt: ["$Distributor.subscriptionPlanExpiryDate", 0],
            },
            subscriptionType: {
              $arrayElemAt: ["$Distributor.subscriptionType", 0],
            },
          },
        },
        {
          $unset: ["Distributor", "userId"],
        },
      ]);

      if (!userExist.length) {
        throw new HttpException("Distributor not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedId,
        requestedType,
        "DISTRIBUTOR",
        "DISTRIBUTOR_PROFILE",
        userExist[0]._id,
        true,
        200,
        `${userExist[0].userType} ${userExist[0].sjbtCode} requested to view profile at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: userExist[0],
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "DISTRIBUTOR",
        "DISTRIBUTOR_PROFILE",
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
  //-------------------------------------------------------------------------
  /**
   * user'getRetailerCount
   */
  //-------------------------------------------------------------------------

  async getRetailerCount(req: any, res: any) {
    try {
      const userExist = await this.userModel.aggregate([
        {
          $match: {
            isDeleted: false,
            "allDistributor.distributorId": new mongoose.Types.ObjectId(
              req.userData.Id
            ),
            //  _id: new mongoose.Types.ObjectId(req.userData.Id)
          },
        },
      ]);

      let totalRetailer = userExist ? userExist.length : 0;
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        totalRetailers: totalRetailer,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * change password
   */
  //-------------------------------------------------------------------------

  async changePassword(req, res) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const { newPassword, confirmPassword } = req.body;

      const reqParams = ["newPassword", "confirmPassword"];

      const requiredKeys = ["newPassword", "confirmPassword"];

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

      if (!req.headers.deviceid) {
        return res.status(200).send({
          message: "Device Id is required.",
          code: "DEVICE_ID_NOT_FOUND.",
          issue: "DEVICE_ID_REQUIRED",
          status: false,
        });
      }

      if (!isValidPassword(req.body.newPassword).status) {
        throw new HttpException(
          isValidPassword(req.body.newPassword).Msg,
          HttpStatus.OK
        );
      }

      const userExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(req.userData.Id),
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });

      if (!userExist) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      if (newPassword !== confirmPassword) {
        throw new HttpException(
          `Password and Confirm Password does not match.`,
          HttpStatus.OK
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      if (!hashedPassword) {
        throw new HttpException(
          `Something went wrong with the password.`,
          HttpStatus.OK
        );
      }

      const dataUpdated = await this.userModel.findByIdAndUpdate(
        { _id: userExist._id },
        { $set: { password: hashedPassword } },
        { new: true }
      );

      if (!dataUpdated) {
        throw new HttpException(
          `Something went wrong. Couldn't change password. Please try again.`,
          HttpStatus.OK
        );
      }

      const userId = userExist._id.toString();
      const userType = userExist.userType;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;
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

        const token = await createToken(
          userExist,
          userType,
          userExist.sjbtCode
        );

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
                userExist.role,
                userExist._id,
                "DISTRIBUTOR",
                "DISTRIBUTOR_CHANGE_PASSWORD",
                userExist._id,
                true,
                200,
                `${userExist.userType} ${userExist.sjbtCode} changed their password at ${currentDate}.`,
                "Password changed successfully.",
                req.socket.remoteAddress
              );
              return res.status(200).send({
                message: "Password changed successfully.",
                token: token,
                data: {
                  userName: userExist.name,
                  email: userExist.email,
                  type: userExist.userType,
                },
                status: true,
                code: "OK",
                issue: null,
              });
            }
          }
        );
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData.type,
        req.userData.Id,
        "DISTRIBUTOR",
        "DISTRIBUTOR_CHANGE_PASSWORD",
        "",
        errData.resData.status,
        errData.statusCode,
        `DISTRIBUTOR tried to request for change password with this credentials at ${moment()
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
   * filter For Check Subscription
   */
  //-------------------------------------------------------------------------
  async filterForCheckSubscription(req, res) {
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
        "sjbtCode",
        "subscriptionId",
        "subscriptionType",
        "subscriptionPlanExpiryDate",
        "subscriptionPayment",
        "isActive",
        "isDeleted",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }],
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
      const booleanFields = ["isActive", "isDeleted"];
      const numberFileds = ["pincode"];

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
      const additionaQuery = [
        {
          $match: {
            subscriptionId: { $ne: "" },
          },
        },
        {
          $addFields: {
            subscription_id: { $toObjectId: "$subscriptionId" },
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "subscription_id",
            foreignField: "_id",
            as: "subscription",
          },
        },
        {
          $addFields: {
            subcriptionAmount: { $arrayElemAt: ["$subscription.amount", 0] },
          },
        },
        {
          $unset: ["subscription", "subscription_id"],
        },
        { $unset: ["__v", "password"] },
      ];

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
          "DISTRIBUTORS"
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
          "DISTRIBUTOR",
          "DISTRIBUTOR_FILTER_PAGINATION_FOR_SUBSCRIPTION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data for view distributor's subscription plan at ${currentDate}.`,
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
        "DISTRIBUTOR",
        "DISTRIBUTOR_FILTER_PAGINATION_FOR_SUBSCRIPTION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data for view distributor's subscription plan with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
