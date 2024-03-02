import { ChangeStatusDto } from "./dto/create-user.dto";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Role, User, UserDocument, VerifyStatus } from "./entities/user.entity";
import {
  PanCategory,
  PanCategoryDocument,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategoryDocument,
} from "../itr-category/entities/itr-category.entity";
import {
  UserFlow,
  UserFlowDocument,
} from "../user-flow/entities/user-flow.entity";
import {
  isAadharValid,
  isEmailValid,
  isMobileValid,
  isPanValid,
  isValidDate,
  isValidPassword,
  isvalidUrl,
} from "../../helper/basicValidation";
import {
  changestatusForUser,
  extractFieldsForUserFlowTable,
} from "../../helper/changeStatus";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import {
  createToken,
  createTokenAdmin,
  otpToken,
} from "../../helper/tokenCreate";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  PriceConfig,
  PriceConfigDocument,
  serviceType,
} from "../price-config/entities/price-config.entity";
import { Otp, OtpDocument, ValidOtp } from "../otp/entity/create-otp.entity";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { Client } from "../../helper/initRedis";
import * as jwt from "jsonwebtoken";
import {
  generateEmailMobileOTP,
  generateOTP,
} from "../../helper/otpGenerate.helper";
import {
  PanApplication,
  PanDocument,
  status,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../digital-sign/entities/digital-sign.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import { Log, LogDocument } from "../log/entities/log.entity";
import { reUploadPdf } from "../../helper/reuploadPdf";
import * as bcrypt from "bcrypt";
import { cancelApplication } from "../../helper/cancelApplication";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import { paymentStatus } from "../transaction/entities/transaction.entity";
import { EmailService } from "../../helper/sendEmail";

@Injectable()
export class UserService {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserFlow.name)
    private readonly UserFlowModel: Model<UserFlowDocument>,
    @InjectModel(PriceConfig.name)
    private readonly priceConfigModel: Model<PriceConfigDocument>,
    @InjectModel(PanCategory.name)
    private readonly PanCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(ItrCategory.name)
    private readonly ItrCategoryModel: Model<ItrCategoryDocument>,
    private readonly addLogFunction: AddLogFunction,
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,
    private readonly userAuthHelper: userAuthHelper,
    @InjectModel(PanApplication.name)
    private readonly panModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private readonly itrModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private readonly dscModel: Model<DigitalSignDocument>,
    @InjectModel(GumastaApplication.name)
    private readonly gumastaModel: Model<GumastaApplicationDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly msmeModel: Model<MsmeApplicationDocument>,
    @InjectModel(Log.name)
    private readonly LogModel: Model<LogDocument>,
    private readonly cancelApplication: cancelApplication,
    private readonly reuploadedPdf: reUploadPdf,
    private readonly EmailService: EmailService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = [];
      const matchQuery = query.push(
        { $match: { isDeleted: false } },
        { $unset: ["__v", "password"] }
      );

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "USERS"
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

      const dataFound = await this.userModel.aggregate(query);
      if (!dataFound.length) {
        throw new HttpException("Users not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of user at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Users found successfully.",
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
        "UESR",
        "UESR_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of user with this credentials at ${moment()
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
   * get categories of users
   */
  //-------------------------------------------------------------------------

  async getCategory(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userId = new mongoose.Types.ObjectId(req.userData.Id);

      /**
       * check userexist
       */
      const userExist = await this.userModel.findOne({
        _id: userId,
        isDeleted: false,
        isBlocked: false,
        isActive: true,
      });

      if (!userExist) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
      }

      /**check service access */
      const service = req.body.serviceName;
      const checkServiceAccess =
        userExist.services && userExist.services.length
          ? userExist.services.includes(service)
          : false;

      if (!checkServiceAccess && requestedType !== Role.GUEST) {
        throw new HttpException("Service access not allowed.", HttpStatus.OK);
      }

      let getCategories;

      if (req.body.serviceName == serviceType.PAN) {
        getCategories = await this.userModel.aggregate([
          {
            $match: {
              _id: userId,
              isDeleted: false,
              isActive: true,
            },
          },
          { $unwind: "$category.panCategories" },
          {
            $addFields: {
              pan_category_all: "$category.panCategories",
            },
          },
          {
            $lookup: {
              from: "pancategories",
              localField: "pan_category_all",
              foreignField: "_id",
              as: "panCategories",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: {
                        if: { $eq: [requestedType, "GUEST"] },
                        then: {
                          $and: [
                            { $eq: ["$showForGuest", true] },
                            { $eq: ["$isActive", true] },
                          ],
                        },
                        else: { $eq: ["$isActive", true] },
                      },
                    },
                  },
                },
                {
                  $project: {
                    categoryName: 1,
                    price: 1,
                    categoryCode: 1,
                    //guestBasePrice: 1,
                    applicableForMinor: 1,
                  },
                },
              ],
            },
          },
          {
            $match: {
              panCategories: { $ne: [] },
            },
          },

          {
            $project: {
              categoryName: {
                $arrayElemAt: ["$panCategories.categoryName", 0],
              },
              categoryCode: {
                $arrayElemAt: ["$panCategories.categoryCode", 0],
              },
              applicableForMinor: {
                $arrayElemAt: ["$panCategories.applicableForMinor", 0],
              },
              price: {
                $arrayElemAt: ["$panCategories.price", 0],
              },

              userType: 1,
              user_id: "$_id",
              _id: 0,
            },
          },
        ]);
      }

      if (req.body.serviceName == serviceType.ITR) {
        getCategories = await this.userModel.aggregate([
          {
            $match: {
              _id: userId,
              isDeleted: false,
            },
          },
          { $unwind: "$category.itrCategories" },
          {
            $addFields: {
              itr_category_all: "$category.itrCategories",
            },
          },
          {
            $lookup: {
              from: "itrcategories",
              localField: "itr_category_all",
              foreignField: "_id",
              as: "itrCategories",
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: {
                        if: { $eq: [requestedType, "GUEST"] },
                        then: {
                          $and: [
                            { $eq: ["$showForGuest", true] },
                            { $eq: ["$isActive", true] },
                          ],
                        },
                        else: { $eq: ["$isActive", true] },
                      },
                    },
                  },
                },
                {
                  $project: {
                    categoryName: 1,
                    price: 1,
                    categoryCode: 1,
                    //guestBasePrice: 1,
                    // applicableForMinor: 1,
                  },
                },
              ],
            },
          },
          {
            $match: {
              itrCategories: { $ne: [] },
            },
          },
          {
            $project: {
              categoryName: {
                $arrayElemAt: ["$itrCategories.categoryName", 0],
              },
              categoryCode: {
                $arrayElemAt: ["$itrCategories.categoryCode", 0],
              },
              price: {
                $arrayElemAt: ["$itrCategories.price", 0],
              },
              userType: 1,
              user_id: "$_id",
              _id: 0,
            },
          },
        ]);
        // getCategories = await this.userModel.aggregate( [
        //   {
        //     $match: {
        //       _id: new mongoose.Types.ObjectId( requestedId ),
        //       isDeleted: false,
        //     },
        //   },
        //   {
        //     $project: {
        //       itrCategoryId: '$category.itrCategories',
        //     },
        //   },
        //   { $unwind: '$itrCategoryId' },
        //   {
        //     $lookup: {
        //       from: 'itrcategories',
        //       let: {
        //         itrCategoryId: '$itrCategoryId',
        //       },
        //       as: 'categoryData',
        //       pipeline: [
        //         {
        //           $match: {
        //             $and: [
        //               { $expr: { $eq: [ '$_id', '$$itrCategoryId' ] } },
        //               { isActive: true },
        //             ],
        //           },
        //         },
        //         {
        //           $project: {
        //             categoryName: 1,
        //             categoryCode: 1,
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   {
        //     $project: {
        //       categoryName: {
        //         $arrayElemAt: [ '$categoryData.categoryName', 0 ],
        //       },
        //       categoryCode: {
        //         $arrayElemAt: [ '$categoryData.categoryCode', 0 ],
        //       },
        //       _id: 0,
        //     },
        //   },
        // ] );
      }

      if (!getCategories.length) {
        throw new HttpException(
          "You are not allow to access this categories.",
          HttpStatus.OK
        );
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_GET_CATEGORY_LIST",
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of user at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Categories found successfully.",
        status: true,
        data: getCategories,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "UESR_GET_CATEGORY_LIST",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to check list of category with this credentials at ${moment()
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
   * get services of users
   */
  //-------------------------------------------------------------------------

  async getServices(res, req) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let userId;
      let requestedId = "";
      let userMobile = "";
      let requestedType = "GUEST";
      let allServices = [];
      const token =
        req.body.token || req.query.token || req.headers["x-access-token"];
      if (token) {
        const decoded = jwt.verify(token, process.env.SEC_KEY_ACC) as {
          [key: string]: any;
        };
        if (decoded) {
          requestedType = decoded?.type || "";
          userId = new mongoose.Types.ObjectId(decoded.Id);
          requestedId = decoded.Id;
          userMobile = decoded.contactNumber;

          /**
           * check userexist
           */
          const userExist = await this.userModel.findOne({
            _id: userId,
            isDeleted: false,
            isBlocked: false,
            isActive: true,
          });

          if (!userExist) {
            throw new HttpException("Invalid user.", HttpStatus.OK);
          }
          allServices = userExist.services;
        }
      }

      const query = { isActive: true };
      const projectQuery = {
        serviceName: 1,
        serviceType: 1,
      };
      if (allServices.length) {
        query["serviceType"] = { $in: allServices };
      }

      if (requestedType === Role.GUEST) {
        projectQuery["price"] = "$guestBaseprice";
      } else {
        projectQuery["price"] = 1;
      }

      const accessibleServices = await this.priceConfigModel.aggregate([
        { $match: { ...query } },
        { $sort: { order: 1 } },
        { $project: { ...projectQuery } },
      ]);

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "USER_SERVICES_LIST",
        requestedId,
        true,
        200,
        `${requestedType} ${userMobile} viewed their services at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Services found successfully.",
        status: true,
        data: accessibleServices,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "USER_SERVICES_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check their list of services with this credentials at ${moment()
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
   * view
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
      const matchQuery = query.push(
        { $match: { isDeleted: false } },
        { $unset: ["__v", "password"] }
      );

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "USERS"
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
        throw new HttpException("User not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed user ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "User found successfully.",
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
        "UESR",
        "UESR_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view user ${id} with this credentials at ${moment()
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
   * update user
   */
  //-------------------------------------------------------------------------

  async update_by_id(id, res, req) {
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
        adhaarCardImage,
        panCardImage,
        cancelChequeImage,
        declarationFormPhotoUrl,
        userType,
        status,
        panNumber,
        role,
        isProfileComplete,
        isAppliedForDistributor,
        isActive,
        isVerified,
        emailVerified,
        mobileNumberVerified,
        allDistributor,
        category,
        service,
      } = req.body;

      // const reqParams = [
      //   'name',
      //   'email',
      //   'dob',
      //   'fatherName',
      //   'firmName',
      //   'address',
      //   'area',
      //   'cityVillageName',
      //   'district',
      //   'pincode',
      //   'state',
      //   'adhaarCardImage',
      //   'panCardImage',
      //   'cancelChequeImage',
      //   'declarationFormPhotoUrl',
      //   'panNumber',
      // ];
      // const requiredKeys = [
      //   'name',
      //   'email',
      //   'dob',
      //   'fatherName',
      //   'firmName',
      //   'address',
      //   'area',
      //   'cityVillageName',
      //   'district',
      //   'pincode',
      //   'state',
      //   'adhaarCardImage',
      //   'panCardImage',
      //   'cancelChequeImage',
      //   'declarationFormPhotoUrl',
      //   'panNumber',
      // ];

      // const isValid = await keyValidationCheck(
      //   req.body,
      //   reqParams,
      //   requiredKeys,
      // );
      // if (!isValid.status) {
      //   return res.status(200).send({
      //     message: isValid.message,
      //     status: false,
      //     code: 'BAD_REQUEST',
      //     issue: 'REQUEST_BODY_VALIDATION_FAILED',
      //     data: null,
      //   });
      // }
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const userId = req.userData.Id;
      const userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!userFound) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const emailExists = await this.userModel.findOne({
        email: email,
        isDeleted: false,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });
      if (emailExists) {
        throw new HttpException(
          "Another user exist with same email.",
          HttpStatus.OK
        );
      }

      const panCardNumberExist = await this.userModel.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        panNumber: panNumber,
        isDeleted: false,
      });
      if (panCardNumberExist) {
        throw new HttpException("PAN number already exist.", HttpStatus.OK);
      }

      /**check email is valid or not */
      if (email && !isEmailValid(email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      /**check dob format is valid or not */
      if (dob && !isValidDate(dob)) {
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

      const updateUser = await this.userModel.findByIdAndUpdate(
        { _id: userFound._id },
        { $set: { ...req.body } },
        { new: true }
      );

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(
        updateUser
      );

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_UPDATE",
        userId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated user ${userId} at ${currentDate}.`,
        "User updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "User updated successfully.",
        status: true,
        data: updateUser,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "UESR_UPDATE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update some user with this credentials at ${moment()
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
   * update user category
   */
  //-------------------------------------------------------------------------

  async updateCategory(id: string, req, res) {
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
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      if (
        userFound.userType === Role.RETAILER ||
        userFound.userType === Role.GUEST
      ) {
        throw new HttpException(
          `Couldn't update categories of RETAILER/GUEST.`,
          HttpStatus.OK
        );
      }
      const result = await this.userModel.findByIdAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $set: { category: req.body.category },
        },
        { new: true }
      );
      if (!result) {
        throw new HttpException(`Categories not found.`, HttpStatus.OK);
      }

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);
      const userId = result._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_UPDATE_CATEGORY",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated category for user ${id} at ${currentDate}.`,
        "Categories for user updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Categories for user updated successfully.",
        status: true,
        data: result,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "UESR_UPDATE_CATEGORY",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update category for user ${id} with this credentials at ${moment()
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
   * update user services
   */
  //-------------------------------------------------------------------------

  async updateServices(id: string, req, res) {
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
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      /**check request services validation */
      const validServices = [
        "DIGITAL_PAN",
        "DSC",
        "GUMASTA",
        "ITR",
        "MSME",
        "PAN",
        "DGPAN",
      ];

      function validateServices(services: string[]): boolean {
        return services.every((service) => validServices.includes(service));
      }
      if (!validateServices(req.body.services)) {
        throw new HttpException(
          `Service type is not valid enum type.`,
          HttpStatus.OK
        );
      }

      if (userFound.userType === "RETAILER" || userFound.userType === "GUEST") {
        throw new HttpException(
          `Couldn't update services of RETAILER/GUEST.`,
          HttpStatus.OK
        );
      }
      const result = await this.userModel.findByIdAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $set: { services: req.body.services },
        },
        { new: true }
      );
      if (!result) {
        throw new HttpException(`Services not found.`, HttpStatus.OK);
      }

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);
      const userId = result._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_UPDATE_SERVICES",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated services fir user ${id} at ${currentDate}.`,
        "Services for user updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Services for user updated successfully.",
        status: true,
        data: result,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "UESR_UPDATE_SERVICES",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update services for user ${id} with this credentials at ${moment()
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
   * remove user
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
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
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!dataUpdated) {
        throw new HttpException("Could not delete users.", HttpStatus.OK);
      }

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(
        dataUpdated
      );
      const userId = dataUpdated._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_DELETE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } deleted user ${id} at ${currentDate}.`,
        "User deleted successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "User deleted successfully.",
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
        "UESR",
        "UESR_DELETE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to delete user ${id} with this credentials at ${moment()
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
   * change status of user
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
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
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }

      const activeStatus = userFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? "ACTIVE" : "DEACTIVE";
      const statusChanged = await this.userModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isActive: activeStatus } },
        { new: true }
      );
      await this.userModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { isActive: activeStatus },
        { new: true }
      );
      if (statusChanged.isActive === activeStatus) {
        const updatedUserFlowFields = await extractFieldsForUserFlowTable(
          statusChanged
        );
        const userId = statusChanged._id.toString();

        const updateUserFlow = await new this.UserFlowModel({
          userId: userId,
          ...updatedUserFlowFields,
        });
        await updateUserFlow.save();

        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "UESR",
          "UESR_CHANGE_STATUS",
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } status changed of user ${id} at ${currentDate}.`,
          `Status changed of user ${id} to ${statusValue} successfully.`,
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: `Status changed to ${statusValue} successfully.`,
          status: true,
          data: null,
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "UESR",
        "UESR_CHANGE_STATUS",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to change status of user ${id} with this credentials at ${moment()
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
        "userId",
        "module",
        "module_action",
        "module_id",
        "resStatus",
        "statusCode",
        "remark",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];

      const matchQuery: { $and: any[] } = { $and: [{}] };

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
      const dataFound = await this.LogModel.aggregate(countQuery);
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

      const result = await this.LogModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "UESR",
          "UESR_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view user at ${currentDate}.`,
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
        "UESR",
        "UESR_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data  with this credentials at ${moment()
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
        isBlockedL: false,
      });
      if (!userFound) {
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }

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

      const updatedUserFlowFields = await extractFieldsForUserFlowTable(result);
      const userId = result._id.toString();

      const updateUserFlow = await new this.UserFlowModel({
        userId: userId,
        ...updatedUserFlowFields,
      });
      await updateUserFlow.save();

      const tokenKey = `${userId}*`;

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "UESR",
        "UESR_UPDATE_STATUS",
        id,
        true,
        200,
        remark,
        "User status updated successfully.",
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
        "UESR",
        "UESR_UPDATE_STATUS",
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

  /***
   * login distributor with refresh token
   */
  //-------------------------------------------------------------------------

  async refreshToken(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";

      const userExist = await this.userModel.findOne({
        _id: req.userData.Id,
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });

      if (!userExist) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
      }

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userId = userExist._id.toString();
      const userType = req.userData.type;
      const deviceId = req.headers.deviceid;

      const userDetails = userId + userType + deviceId;

      Client.GET(userDetails, async (err: any, result: any) => {
        if (err) {
          return res.status(200).send({
            message: "Something went wrong.",
            status: false,
            data: null,
            code: "INVALID_REFRESH_TOKEN",
            issue: "AUTHENTICATION_FAILED",
          });
        }

        if (!result) {
          return res.status(200).send({
            message: "Token not found.",
            status: false,
            data: null,
            code: "TOKEN_NOT_FOUND",
            issue: "AUTHENTICATION_FAILED",
          });
        }

        const matchRefreshToken = await result.split(
          `${process.env.TOKEN_KEY}`
        );

        if (req.body.token === matchRefreshToken[1]) {
          const token = await createToken(
            userExist,
            req.userData.type,
            req.userData?.sjbtCode
          );

          const tokenString = `${token.accessToken}${process.env.TOKEN_KEY}${token.refreshToken}`;

          Client.SET(
            userDetails,
            tokenString,
            "EX",
            60 * 60 * 24 * 30,
            (err, result) => {
              if (err) {
                throw new HttpException(
                  "Something went wrong.",
                  HttpStatus.INTERNAL_SERVER_ERROR
                );
              }
              this.addLogFunction.logAdd(
                req,
                requestedType,
                requestedId,
                "USER",
                "USER_REFRESH_TOKEN",
                requestedId,
                true,
                200,
                `${requestedType} ${
                  req.userData?.contactNumber || ""
                } requested with refresh token for access token at ${currentDate}.`,
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
                  userType: userExist.userType,
                },
                code: "OK",
                issue: null,
              });
            }
          );
        } else {
          return res.status(401).send({
            msg: "Authentication Failed.",
            code: "INVALID_TOKEN.",
            issue: "INVALID_TOKEN",
            status: false,
          });
        }
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        "",
        "",
        "USER",
        "USER_REFRESH_TOKEN",
        "",
        errData.resData.status,
        errData.statusCode,
        `USER tried to login with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  /***
   *resend otp
   */
  //-------------------------------------------------------------------------

  async resendOTP(req, res) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const userId = req.otpData.Id;
      const otpUserType = req.otpData.type;

      const userExist = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });

      if (!userExist) {
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }

      let msg91Data = {
        template_id: process.env.MSG91_OTP_TEMPLATE_ID,
        sender: process.env.MSG91_SENDER_ID,
        short_url: "0",
        mobiles: "+91" + userExist.mobileNumber,
        otp: "",
      };
      const tenMinutesLater = moment()
        .utcOffset("+05:30")
        .add(10, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");

      //generate otp
      const OTP = generateOTP(req);

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userId,
            userType: otpUserType,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: userId,
            userType: otpUserType,
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
            userId: userId,
            userType: otpUserType,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: userId,
            userType: otpUserType,
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
          name: userExist.name,
          sjbtCode: userExist.sjbtCode,
          otp: OTP.emailOTP,
        },
        userExist.email
      );
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
        otpUserType,
        userExist.sjbtCode
      );

      this.addLogFunction.logAdd(
        req,
        `${otpUserType}`,
        `${userId}`,
        "",
        `RESEND_OTP`,
        `${userId}`,
        true,
        200,
        `${otpUserType} do request for OTP at ${currentDate}.`,
        "Resend OTP successfully.",
        req.socket.remoteAddress
      );

      return res.status(200).send({
        message: "Resend OTP successfully.",
        token: token,
        data: {
          userType: otpUserType,
          isProfileCompleted: userExist.isProfileComplete,
        },
        // emailOTP: OTP.emailOTP,
        // mobileOTP: OTP.mobileOTP,
        status: true,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.otpData?.userType || "",
        req.otpData?.userId || "",
        `${req.otpData.type}`,
        `RESEND_OTP`,
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.otpData?.userType || ""} ${
          req.otpData?.userId || ""
        } tried to do request for resend otp with this credentials at ${moment()
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
   * AdharCheck
   */
  //-------------------------------------------------------------------------

  async Adharcheck(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const adharNumber = req.body.adharNumber;
      const serviceName = req.body.serviceName;

      /**check adhar number is valid or not */
      if (!adharNumber) {
        throw new HttpException(
          "Aadhar number must be valid number.",
          HttpStatus.OK
        );
      }
      if (adharNumber && isAadharValid(adharNumber) === false) {
        throw new HttpException(
          "Aadhar number must be valid number.",
          HttpStatus.OK
        );
      }

      let adharExist;

      if (serviceName == serviceType.PAN) {
        adharExist = await this.panModel.findOne({
          adhaarNumber: adharNumber,
          isDeleted: false,
          txnStatus: paymentStatus.SUCCESS,
        });
      }
      if (serviceName == serviceType.ITR) {
        adharExist = await this.itrModel.findOne({
          adhaarNumber: adharNumber,
          isDeleted: false,
          txnStatus: paymentStatus.SUCCESS,
        });
      }
      if (serviceName == serviceType.DSC) {
        adharExist = await this.dscModel.findOne({
          adhaarNumber: adharNumber,
          isDeleted: false,
          txnStatus: paymentStatus.SUCCESS,
        });
      }
      if (serviceName == serviceType.GUMASTA) {
        adharExist = await this.gumastaModel.findOne({
          adhaarNumber: adharNumber,
          isDeleted: false,
          txnStatus: paymentStatus.SUCCESS,
        });
      }
      if (serviceName == serviceType.MSME) {
        adharExist = await this.msmeModel.findOne({
          adhaarNumber: adharNumber,
          isDeleted: false,
          txnStatus: paymentStatus.SUCCESS,
        });
      }

      let resToSend = { status: false, Msg: "" };
      if (adharExist) {
        resToSend = { status: true, Msg: "Adhar number already exist." };
      } else {
        resToSend = { status: false, Msg: "Adhar number not found." };
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "USER",
        "USER_ADHAR_CHECK",
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked adhar exist at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: resToSend.Msg,
        status: true,
        data: resToSend,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "USER",
        "USER_ADHAR_CHECK",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check adhar number exist.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * check-field-already-exist
   */
  //-------------------------------------------------------------------------
  async checkFieldsExist(res, req) {
    try {
      let userId;
      let requestedId = "";
      let requestedType = "GUEST";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const token =
        req.body.token || req.query.token || req.headers["x-access-token"];

      const { email, mobileNumber, panNumber } = req.body;

      /**check pannumber is valid or not */
      if (panNumber && panNumber !== "") {
        if (isPanValid(panNumber) === false) {
          throw new HttpException(
            "Pan number must be valid number.",
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
      }
      /**check email is valid or not */
      if (email && email !== "") {
        if (!isEmailValid(email)) {
          throw new HttpException("Invalid email Id.", HttpStatus.OK);
        }
      }

      const resToSend = {
        emailExistMsg: "",
        panExistMsg: "",
        mobileExistMsg: "",
        email: false,
        mobileNumber: false,
        panNumber: false,
      };

      if (token) {
        const decoded = jwt.verify(token, process.env.SEC_KEY_ACC) as {
          [key: string]: any;
        };
        if (decoded) {
          requestedType = decoded?.type || "";
          userId = new mongoose.Types.ObjectId(decoded.Id);
          requestedId = decoded.Id;
          /**
           * check userexist
           */
          const userExist = await this.userModel.findOne({
            _id: userId,
            isDeleted: false,
            isBlocked: false,
            isActive: true,
          });

          if (!userExist) {
            throw new HttpException("Invalid user.", HttpStatus.OK);
          }

          const emailExist = await this.userModel.findOne({
            _id: { $ne: new mongoose.Types.ObjectId(requestedId) },
            email: email,
          });
          const mobileExist = await this.userModel.findOne({
            _id: { $ne: new mongoose.Types.ObjectId(requestedId) },
            mobileNumber: mobileNumber,
          });
          const panExist = await this.userModel.findOne({
            _id: { $ne: new mongoose.Types.ObjectId(requestedId) },
            panNumber: panNumber,
          });

          if (emailExist && emailExist.email !== "") {
            resToSend.email = true;
            resToSend.emailExistMsg = `Email already registered as a ${emailExist.userType.toLowerCase()}`;
          }

          if (mobileExist && mobileExist.mobileNumber !== "") {
            resToSend.mobileNumber = true;
            resToSend.mobileExistMsg = `Mobile number already registered as a ${mobileExist.userType.toLowerCase()}`;
          }

          if (panExist && panExist.panNumber !== "") {
            resToSend.panNumber = true;
            resToSend.panExistMsg = `Pan number already registered as a ${panExist.userType.toLowerCase()}`;
          }
          this.addLogFunction.logAdd(
            req,
            requestedType,
            requestedId,
            "USER",
            "USER_FIELDS_CHECK",
            requestedId,
            true,
            200,
            `${requestedType} ${
              req.userData?.contactNumber || ""
            } checked fields exist at ${currentDate}.`,
            "Data found successfully.",
            req.socket.remoteAddress
          );
          return res.status(200).send({
            message: "Data found successfully.",
            status: true,
            data: resToSend,
            code: "OK",
            issue: null,
          });
        }
      } else {
        const emailExist = await this.userModel.findOne({ email: email });
        const mobileExist = await this.userModel.findOne({
          mobileNumber: mobileNumber,
        });

        const panExist = await this.userModel.findOne({
          panNumber: panNumber,
        });

        if (emailExist && emailExist.email !== "" && email !== "") {
          resToSend.email = true;
          resToSend.emailExistMsg = `Email already registered as a ${emailExist.userType.toLowerCase()}`;
        }

        if (mobileExist && mobileExist.mobileNumber !== "") {
          resToSend.mobileNumber = true;
          resToSend.mobileExistMsg = `Mobile number already registered as a ${mobileExist.userType.toLowerCase()}`;
        }

        if (panExist && panExist.panNumber !== "") {
          resToSend.panNumber = true;
          resToSend.panExistMsg = `Pan number already registered as a ${panExist.userType.toLowerCase()}`;
        }
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "USER",
          "USER_FIELDS_CHECK",
          requestedId,
          true,
          200,
          `${requestedType} having phone number ${
            req.userData?.contactNumber || ""
          } have applied for application with this number  at ${currentDate}.`,
          "Data found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          message: "Data found successfully.",
          status: true,
          data: resToSend,
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
        "USER",
        "USER_FIELDS_CHECK",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check email panNumber mobile fields .`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * cancel application of user
   */
  //-------------------------------------------------------------------------

  async cancelApp(res, req) {
    try {
      const { serviceName, applicationId } = req.body;

      const reqParams = ["serviceName", "applicationId"];

      const requiredKeys = ["serviceName", "applicationId"];

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
      const requestedName = req.userData?.userName || "";

      const userData = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(requestedId),
        isActive: true,
        isBlocked: false,
        isDeleted: false,
      });

      if (!userData) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const cancelApp =
        await this.cancelApplication.updateAllFunctionForCancelApp(
          applicationId,
          serviceName,
          req
        );

      if (cancelApp.status) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          `${req.body.serviceName}_APPLICATION`,
          `${req.body.serviceName}_APPLICATION_CANCEL`,
          req.body.applicationId,
          true,
          200,
          `${requestedType} ${requestedName} cancel application of ${req.body.serviceName}.`,
          `Application cancelled successfully.`,
          req.socket.remoteAddress
        );

        return res.status(200).send({
          message: cancelApp.message,
          status: cancelApp.status,
          data: cancelApp.data,
          code: "OK",
          issue: null,
        });
      } else {
        throw new HttpException(
          `Something went wrong. Unable to cancel application`,
          HttpStatus.OK
        );
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        `${req.body.serviceName}_APPLICATION`,
        `${req.body.serviceName}_APPLICATION_CANCEL`,
        req.body.applicationId,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} having contact number ${
          req.userData?.contactNumber || ""
        } tried to cancel application of ${req.body.serviceName} ${
          req.body.applicationId
        }with this credentials at ${moment()
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
   * resetpassword
   */
  //-------------------------------------------------------------------------

  async resetPassword(res, req) {
    try {
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
      const userExist = await this.userModel.findOne({
        _id: req.userData.Id,
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });
      if (!userExist) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
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

      req.body.password = hashedPassword;
      const dataUpdated = await this.userModel.findByIdAndUpdate(
        {
          _id: req.userData.Id,
        },
        {
          $set: {
            password: req.body.password,
          },
        }
      );
      if (!dataUpdated) {
        throw new HttpException(
          `Something went wrong. Could not update password. Please try again.`,
          HttpStatus.OK
        );
      }

      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const requestedName = req.userData?.userName || "";

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        `USER`,
        `USER_RESET_PASSWORD`,
        req.body.applicationId,
        true,
        200,
        `${requestedType} ${requestedName} reset password at ${currentDate}.`,
        `Password reset successfully.`,
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: `'Password updated successfully. Please login with new password.`,
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
        `USER`,
        `USER_RESET_PASSWORD`,
        req.body.applicationId,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to reset password with this credentials at ${moment()
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
   * forgot password
   */
  //-------------------------------------------------------------------------

  async forgotPassword(res, req) {
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

      const isEmail = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i.test(
        mobileNumber
      ); // Check if the mobileNumber is an email
      const isMobile = /^\d+$/.test(mobileNumber);

      let userExist;
      if (isEmail && !isMobile) {
        userExist = await this.userModel.findOne({
          email: mobileNumber,
          userType: Role.DISTRIBUTOR,
          isBlocked: false,
          isActive: true,
          isDeleted: false,
        });

        // /**check mobile number is valid or not*/
        // if (mobileNumber && !isEmailValid(mobileNumber)) {
        //   throw new HttpException(
        //     'Email ID must be a valid email ID.',
        //     HttpStatus.OK,
        //   );
        // }
      }
      if (isMobile) {
        userExist = await this.userModel.findOne({
          mobileNumber: mobileNumber,
          userType: Role.DISTRIBUTOR,
          isBlocked: false,
          isActive: true,
          isDeleted: false,
        });

        /**check mobile number is valid or not*/
        if (mobileNumber && !isMobileValid(mobileNumber)) {
          throw new HttpException(
            "Mobile number must be a valid number.",
            HttpStatus.OK
          );
        }
      }

      if (!userExist) {
        throw new HttpException(`User not found.`, HttpStatus.OK);
      }

      if (userExist && !userExist.isActive) {
        throw new HttpException(`Your account is under review.`, HttpStatus.OK);
      }
      if (userExist && userExist.isBlocked) {
        throw new HttpException(`Your account is blocked.`, HttpStatus.OK);
      }

      const tenMinutesLater = moment()
        .utcOffset("+05:30")
        .add(10, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");

      //generate otp
      const OTP = generateEmailMobileOTP(req);

      if (OTP.emailOTP) {
        const otpDataUpdate = await this.otpModel.updateOne(
          {
            userId: userExist._id,
            userType: userExist.userType,
            isOtpUsed: false,
            otpType: ValidOtp.EMAIL,
          },
          {
            userId: userExist._id,
            userType: userExist.userType,
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
            userId: userExist._id,
            userType: userExist.userType,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          {
            userId: userExist._id,
            userType: userExist.userType,
            expiresIn: tenMinutesLater,
            mobileOTP: OTP.mobileOTP,
            isOtpUsed: false,
            otpType: ValidOtp.MOBILE,
          },
          { upsert: true }
        );
      }

      msg91Data.otp = OTP.mobileOTP;

      if (isEmail) {
        let sendEmailOtp = await this.EmailService.sendEmailOTPTemplate(
          {
            name: userExist.name,
            sjbtCode: userExist.sjbtCode,
            otp: OTP.emailOTP,
          },
          mobileNumber
        );

        if (!sendEmailOtp) {
          throw new HttpException(
            "Couldn't send OTP to the email. Please try again.",
            HttpStatus.OK
          );
        }
      } else {
        const msgSent: any = await sendMsg91Function(msg91Data);

        if (!msgSent || !msgSent.sendStatus) {
          throw new HttpException(
            "Couldn't send otp on entered mobile number. Please try again.",
            HttpStatus.OK
          );
        }
      }

      const token = await otpToken(
        userExist,
        req,
        userExist.userType,
        userExist.sjbtCode
      );
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        `${requestedType}_FORGOT_PASSWORD`,
        `${requestedId}_FORGOT_PASSWORD`,
        userExist._id,
        true,
        200,
        `${userExist.userType} ${userExist.mobileNumber} logged in via forgot password ${currentDate}.`,
        "Successfull!. Please verify OTP.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        status: true,
        message: "Successfull!. Please verify OTP.",
        token: token,
        data: {
          userId: userExist._id,
          mobileNumber: userExist.mobileNumber,
          UserType: userExist.userType,
          otp: OTP,
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
        `${req.userData?.type || ""}_FORGOT_PASSWORD`,
        `${req.userData?.type || ""}_FORGOT_PASSWORD`,
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to logged in via forgot password with this credentials at ${moment()
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
   * reupload pdf
   */
  //-------------------------------------------------------------------------

  async reUploadPdf(id: string, res, req, file: Express.Multer.File) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const requestedName = req.userData?.userName || "";

      if (req.file == undefined) {
        throw new HttpException(`Acknowledge PDF is required.`, HttpStatus.OK);
      }

      const path_array = file.path.split("public");
      file.path = `${process.env.LOCAL}public${
        path_array[path_array.length - 1]
      }`;

      const imagePath = file.path;

      const reuploadedPdf =
        await this.reuploadedPdf.updateAllFunctionForReuploadPdf(
          id,
          req.body.serviceName,
          req,
          imagePath
        );

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        `${req.body.serviceName}_APPLICATION`,
        `${req.body.serviceName}_APPLICATION_REUPLOAD_PDF`,
        req.body.applicationId,
        true,
        200,
        `${requestedType} ${requestedName} reuploaded acknowledge PDF of ${req.body.serviceName} application ${req.body.applicationId} at ${currentDate}.`,
        `PDF reuploaded successfully.`,
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: reuploadedPdf.message,
        status: reuploadedPdf.status,
        data: reuploadedPdf.data,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        `${req.body.serviceName}_APPLICATION`,
        `${req.body.serviceName}_APPLICATION_REUPLOAD_PDF`,
        req.body.applicationId,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to reupload PDF of ${req.body.serviceName} application ${
          req.body.applicationId
        } with this credentials at ${moment()
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
   * user change password
   */
  //-------------------------------------------------------------------------

  async changePassword(req, res) {
    try {
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const { currentPassword, newPassword, confirmPassword } = req.body;

      const reqParams = ["currentPassword", "newPassword", "confirmPassword"];

      const requiredKeys = [
        "currentPassword",
        "newPassword",
        "confirmPassword",
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

      if (currentPassword == newPassword) {
        throw new HttpException(
          `Previous password must not match with new password.`,
          HttpStatus.OK
        );
      }

      const matchedPass = await bcrypt.compare(
        currentPassword,
        userExist.password
      );

      if (!matchedPass) {
        throw new HttpException("Current password is invalid.", HttpStatus.OK);
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

      // const userDetails = userId + userType + deviceId;
      // const tokenKey = `${userId}*`;

      // Client.KEYS(tokenKey, async (err: any, keys: any) => {
      //   if (err) {
      //     console.log('Some error occurred', err);
      //   }

      //   if (!keys || keys.length === 0) {
      //     console.log('No keys found.');
      //   }

      //   const deletePromises = keys.map((key: any) => Client.DEL(key));
      //   await Promise.all(deletePromises);

      const token = await createTokenAdmin(userExist);

      //   const tokenString = `${token.accessToken}${process.env.TOKEN_KEY}${token.refreshToken}`;

      //   Client.SET(
      //     userDetails,
      //     tokenString,
      //     'EX',
      //     365 * 24 * 60 * 60,
      //     (err, result) => {
      //       if (err) {
      //         throw new HttpException('Something went wrong.', HttpStatus.OK);
      //       } else {
      this.addLogFunction.logAdd(
        req,
        userExist.userType,
        userExist._id,
        "USER",
        "USER_CHANGE_PASSWORD",
        userExist._id,
        true,
        200,
        `${userExist.userType} ${userExist.name} changed password at ${currentDate}.`,
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
      //       }
      //     },
      //   );
      // });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData.userType,
        req.userData.Id,
        "USER",
        "USER_CHANGE_PASSWORD",
        "",
        errData.resData.status,
        errData.statusCode,
        `USER tried to request for change password with this credentials at ${moment()
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
   * declaration form get api for app
   */
  //-------------------------------------------------------------------------

  async deleteUserAccount(req, res, token) {
    try {
      let userToken = req.query.token;
      const decoded = await this.userAuthHelper.AccTokenDecode(req);

      if (!decoded) {
        return res.status(401).send({
          message: "Invalid token found.",
          code: "INVALID_TOKEN.",
          issue: "AUTHENTICATION_FAILED",
          data: null,
          status: false,
        });
      }

      req["userData"] = decoded;
      /***get user and delete */
      let deleteUser = await this.userModel.findByIdAndUpdate(
        { _id: req.userData.Id },
        {
          $set: {
            isDeleted: true,
          },
        },
        {
          new: true,
        }
      );

      if (!deleteUser) {
        return res.status(401).send({
          message: "Something went wrong, Unable to delete user.",
          data: null,
          status: false,
        });
      }

      /****delete token from redis */
      const userId = req.userData.Id;
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
      });

      return res.status(200).send({
        message: "User deleted successfully.",
        data: null,
        status: true,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
