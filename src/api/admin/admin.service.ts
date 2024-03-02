import { Admin, adminDocument, adminType } from "./entities/admin.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import * as moment from "moment";
import {
  isEmailValid,
  isMobileValid,
  isUserNameValid,
  isValidPassword,
} from "../../helper/basicValidation";
import { errorRes } from "../../helper/errorRes";
import { Client } from "../../helper/initRedis";
import { createTokenAdmin } from "../../helper/tokenCreate";
import { AddLogFunction } from "../../helper/addLog";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import { reportAdmin } from "../../helper/reportCountForAdmin";
import * as fs from "fs";
import { userAuthHelper } from "../../auth/auth.helper";
import { reportDistributor } from "../../helper/reportCountForDistributor";
import { Role } from "../user/entities/user.entity";
import { reportForRetailer } from "../../helper/reportCountForRetailer";
import { generateRandomPassword } from "../../helper/basicValidation";
import { EmailService } from "../../helper/sendEmail";

@Injectable()
export class AdminService {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly reportFunction: reportAdmin,
    private readonly userAuthHelper: userAuthHelper,
    private readonly reportDistributor: reportDistributor,
    private readonly reportRetailer: reportForRetailer,
    private readonly EmailService: EmailService
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create admin
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const {
        userName,
        password,
        confirm_password,
        email,
        mobile,
        printWaitTime,
        applicationStatusAccess,
        maximumInprogressCount,
        adminRoleGroupName,
      } = req.body;
      const reqParams = [
        "userName",
        "password",
        "confirm_password",
        "email",
        "mobile",
        "printWaitTime",
        "applicationStatusAccess",
        "maximumInprogressCount",
        "adminRoleGroupName",
      ];
      const requiredKeys = [
        "userName",
        "password",
        "confirm_password",
        "email",
        "mobile",
        "printWaitTime",
        "applicationStatusAccess",
        "maximumInprogressCount",
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

      if (req.userData.type === "ADMIN") {
        throw new HttpException(
          "You dont have authority to add admins.",
          HttpStatus.OK
        );
      }

      const userNameExist = await this.adminModel.findOne({
        userName: req.body.userName.toLowerCase(),
      });

      if (userNameExist) {
        throw new HttpException(
          "Another admin exist with same username.",
          HttpStatus.OK
        );
      }

      const emailExists = await this.adminModel.findOne({
        email: req.body.email.toLowerCase(),
      });

      if (emailExists) {
        throw new HttpException(
          "Another admin exist with same email.",
          HttpStatus.OK
        );
      }

      const mobileExists = await this.adminModel.findOne({
        mobile: req.body.mobile,
      });
      if (mobileExists) {
        throw new HttpException(
          "Another user exist with same mobile number.",
          HttpStatus.OK
        );
      }

      /**check mobile number is valid or not*/
      if (!isUserNameValid(req.body.userName)) {
        throw new HttpException(
          "Username must not contain spaces.",
          HttpStatus.OK
        );
      }

      /**check mobile number is valid or not*/
      if (!isMobileValid(req.body.mobile)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check email is valid or not */
      if (!isEmailValid(req.body.email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      if (!isValidPassword(req.body.password).status) {
        throw new HttpException(
          isValidPassword(req.body.password).Msg,
          HttpStatus.OK
        );
      }

      if (req.body.password !== req.body.confirm_password) {
        throw new HttpException(
          "Password and Confirm Password does not match.",
          HttpStatus.OK
        );
      }

      //--------------check email exist--------------

      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      if (!hashedPassword) {
        throw new HttpException(
          "Something went wrong with the password.",
          HttpStatus.OK
        );
      }

      req.body.password = hashedPassword;
      req.body.adminRoleGroupName = req.body.adminRoleGroupName.toUpperCase();
      const result = await new this.adminModel({ ...req.body }).save();
      if (!result) {
        throw new HttpException("Unable to add admin.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "ADMIN",
        "ADMIN_ADD",
        result._id,
        true,
        200,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          result.mobile
        } added admin at ${currentDate}.`,
        "Admin added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Admin added successfully.",
        status: true,
        data: result,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData.Id,
        req.userData?.type || "",
        "ADMIN",
        "ADMIN_ADD",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to add admin with this credentials at ${moment()
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
   * update admin
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, res, req) {
    try {
      const {
        userName,
        email,
        mobile,
        role,
        printWaitTime,
        applicationStatusAccess,
        maximumInprogressCount,
        adminRoleGroupName,
      } = req.body;
      const reqParams = [
        "userName",
        "email",
        "mobile",
        "printWaitTime",
        "applicationStatusAccess",
        "maximumInprogressCount",
        "adminRoleGroupName",
      ];
      const requiredKeys = [
        "userName",
        "email",
        "mobile",
        "printWaitTime",
        "applicationStatusAccess",
        "maximumInprogressCount",
        "adminRoleGroupName",
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

      const userFound = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (!userFound) {
        throw new HttpException("Admin not found.", HttpStatus.OK);
      }

      const userNameExist = await this.adminModel.findOne({
        userName: req.body.userName.toLowerCase(),
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });

      if (userNameExist) {
        throw new HttpException(
          "Another admin exist with same username.",
          HttpStatus.OK
        );
      }

      const emailExists = await this.adminModel.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });

      if (emailExists) {
        throw new HttpException(
          "Another admin exist with same email.",
          HttpStatus.OK
        );
      }

      const mobileExists = await this.adminModel.findOne({
        mobile: req.body.mobile,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });
      if (mobileExists) {
        throw new HttpException(
          "Another admin exist with same mobile number.",
          HttpStatus.OK
        );
      }

      /**check mobile number is valid or not*/
      if (!isMobileValid(req.body.mobile)) {
        throw new HttpException(
          "Mobile number must be a valid number.",
          HttpStatus.OK
        );
      }

      /**check email is valid or not */
      if (!isEmailValid(req.body.email)) {
        throw new HttpException("Invalid email Id.", HttpStatus.OK);
      }

      const result = await this.adminModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { ...req.body } },
        { new: true }
      );

      if (!result) {
        throw new HttpException("Could not update .", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        req.userData.Id,
        req.userData?.type || "",
        "ADMIN",
        "ADMIN_UPDATE",
        id,
        true,
        200,
        `${req.userData?.type || ""} ${req.userData?.contactNumber || ""} ${
          userFound.mobile
        } update admin ${id} at ${currentDate}.`,
        "Admin updated successfully",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Admin updated successfully.",
        status: true,
        data: result,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData.Id,
        req.userData?.type || "",
        "ADMIN",
        "ADMIN_UPDATE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update admin ${id} with this credentials at ${moment()
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
      const query = {
        isDeleted: false,
      };
      const dataFound = await this.adminModel.aggregate([
        { $match: { ...query } },
        { $unset: ["__v", "password"] },
      ]);
      if (!dataFound.length) {
        throw new HttpException("Admin not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ADMIN",
        "ADMIN_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of admin at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Admin found successfully.",
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
        "ADMIN",
        "ADMIN_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of admin with this credentials at ${moment()
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
   * login admin
   */
  //-------------------------------------------------------------------------

  async login(req, res) {
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
      const username = req.body.userName;

      const adminExist = await this.adminModel.findOne({
        userName: username.toLowerCase(),
      });
      if (!adminExist) {
        throw new HttpException("Invalid username.", HttpStatus.OK);
      }

      const pass = adminExist.password;

      const matchedPass = await bcrypt.compare(req.body.password, pass);

      if (!matchedPass) {
        throw new HttpException("Invalid password.", HttpStatus.OK);
      }

      const adminId = adminExist._id.toString();
      const adminType = adminExist.role;
      const deviceId = req.headers.deviceid;

      const userDetails = adminId + adminType + deviceId;

      const token = await createTokenAdmin(adminExist);

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
              adminExist.role,
              adminId,
              "ADMIN",
              "ADMIN_LOGIN",
              adminId,
              true,
              200,
              `${adminExist.role} ${adminExist.userName} login at ${currentDate}.`,
              "Login successfully!",
              req.socket.remoteAddress
            );

            return res.status(200).send({
              status: true,
              message: "Login successfully.!",
              token: token,
              data: {
                userName: adminExist.userName,
                email: adminExist.email,
                type: adminExist.role,
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
        "ADMIN",
        "ADMIN_LOGIN",
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

      const userFound = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });
      if (!userFound) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.adminModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!dataUpdated) {
        throw new HttpException("Could not delete users.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ADMIN",
        "ADMIN_DELETE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } deleted admin ${id} at ${currentDate}.`,
        "Admin deleted successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Admin deleted successfully.",
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
        "ADMIN",
        "ADMIN_DELETE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to delete admin ${id} with this credentials at ${moment()
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
   * login admin with refresh token
   */
  //-------------------------------------------------------------------------

  async refreshToken(req, res) {
    try {
      const adminExist = await this.adminModel.findOne({
        _id: req.userData.Id,
      });
      if (!adminExist) {
        throw new HttpException("Invalid username.", HttpStatus.OK);
      }

      const adminId = adminExist._id.toString();
      const adminType = adminExist.role;
      const deviceId = req.headers.deviceid;

      const userDetails = adminId + adminType + deviceId;

      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

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
          const token = await createTokenAdmin(adminExist);

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
                adminExist.role,
                adminId,
                "ADMIN",
                "ADMIN_REFRESH_TOKEN",
                adminId,
                true,
                200,
                `${adminExist.role} ${adminExist.userName} do request for access token at ${currentDate}.`,
                "Login successfully!",
                req.socket.remoteAddress
              );
              return res.status(200).send({
                status: true,
                message: "Login successfully.!",
                token: token,
                data: {
                  userName: adminExist.userName,
                  email: adminExist.email,
                  type: adminExist.role,
                },
                code: "OK",
                issue: null,
              });
            }
          );
        } else {
          throw new HttpException("Invalid user.", HttpStatus.OK);
        }
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        "",
        "",
        "ADMIN",
        "ADMIN_REFRESH_TOKEN",
        "",
        errData.resData.status,
        errData.statusCode,
        `ADMIN tried to request for access token with this credentials at ${moment()
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
        "userName",
        "email",
        "mobile",
        "role",
        "printWaitTime",
        "maximumInprogressCount",
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
        //rangeFilterBy !== {} &&
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
      const numberFileds = ["printWaitTime", "maximumInprogressCount"];

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
      const dataFound = await this.adminModel.aggregate(countQuery);

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

      if (req.userData.type === "ADMIN") {
        /**project query for admin role */
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "ADMINS"
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
      const result = await this.adminModel.aggregate(query);

      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          req.userData?.type || "",
          req.userData.Id,
          "ADMIN",
          "ADMIN_FILTER_PAGINATION",
          req.userData?.Id || "",
          true,
          200,
          `${
            req.userData?.type || ""
          } request for filter data at ${currentDate}.`,
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
        "ADMIN",
        "ADMIN_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.body.type} ${
          req.userData.Id
        } tried to request filter data with this credentials at ${moment()
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
   * change password
   */
  //-------------------------------------------------------------------------

  async forgotPassword(req, res) {
    try {
      const currentDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

      const { emailId, userName } = req.body;

      const reqParams = ["emailId", "userName"];

      const requiredKeys = ["emailId"];

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

      const adminExist = await this.adminModel.findOne({
        // email: emailId,
        isDeleted: false,
        role: adminType.SUPER_ADMIN,
      });

      if (!adminExist) {
        throw new HttpException("Super admin not found.", HttpStatus.OK);
      }

      const generatedPassword = generateRandomPassword();

      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      if (!hashedPassword) {
        throw new HttpException(
          `Something went wrong with the password.`,
          HttpStatus.OK
        );
      }

      const dataUpdated = await this.adminModel.findByIdAndUpdate(
        { _id: adminExist._id },
        { password: hashedPassword }
      );

      if (!dataUpdated) {
        throw new HttpException(
          `Something went wrong. Couldn't change password. Please try again.`,
          HttpStatus.OK
        );
      }

      //-------------send refrence number to email Id-------------//

      let sendPassword = await this.EmailService.sendResetPasswordTemplate(
        generatedPassword,
        emailId
      );

      if (!sendPassword) {
        console.log("email not sent");
      }
      return res.status(200).send({
        status: true,
        message: "Please check your mail.!",
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

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

      const adminExist = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(req.userData.Id),
        isDeleted: false,
      });

      if (!adminExist) {
        throw new HttpException("Admin not found.", HttpStatus.OK);
      }

      if (newPassword !== confirmPassword) {
        throw new HttpException(
          `Password and Confirm Password does not match.`,
          HttpStatus.OK
        );
      }

      if (currentPassword == newPassword) {
        throw new HttpException(
          `Previous password do not match with new password.`,
          HttpStatus.OK
        );
      }

      const matchedPass = await bcrypt.compare(
        currentPassword,
        adminExist.password
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

      const dataUpdated = await this.adminModel.findByIdAndUpdate(
        { _id: adminExist._id },
        { $set: { password: hashedPassword } },
        { new: true }
      );

      if (!dataUpdated) {
        throw new HttpException(
          `Something went wrong. Couldn't change password. Please try again.`,
          HttpStatus.OK
        );
      }

      const adminId = adminExist._id.toString();
      const adminType = adminExist.role;
      const deviceId = req.headers.deviceid;

      const userDetails = adminId + adminType + deviceId;
      const tokenKey = `${adminId}*`;

      Client.KEYS(tokenKey, async (err: any, keys: any) => {
        if (err) {
          console.log("Some error occurred", err);
        }

        if (!keys || keys.length === 0) {
          console.log("No keys found.");
        }

        const deletePromises = keys.map((key: any) => Client.DEL(key));
        await Promise.all(deletePromises);

        const token = await createTokenAdmin(adminExist);

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
                adminExist.role,
                adminExist._id,
                "ADMIN",
                "ADMIN_CHANGE_PASSWORD",
                adminExist._id,
                true,
                200,
                `${adminExist.role} ${adminExist.userName} changed password at ${currentDate}.`,
                "Password changed successfully.",
                req.socket.remoteAddress
              );
              return res.status(200).send({
                message: "Password changed successfully.",
                token: token,
                data: {
                  userName: adminExist.userName,
                  email: adminExist.email,
                  type: adminExist.role,
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
        "ADMIN",
        "ADMIN_CHANGE_PASSWORD",
        "",
        errData.resData.status,
        errData.statusCode,
        `ADMIN tried to request for change password with this credentials at ${moment()
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
   * admin change password by Superadmin
   */
  //-------------------------------------------------------------------------
  async changePasswordBySuperAdmin(id, req, res) {
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

      if (!isValidPassword(req.body.newPassword).status) {
        throw new HttpException(
          isValidPassword(req.body.newPassword).Msg,
          HttpStatus.OK
        );
      }

      const adminExist = await this.adminModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!adminExist) {
        throw new HttpException("Admin not found.", HttpStatus.OK);
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

      const dataUpdated = await this.adminModel.findByIdAndUpdate(
        { _id: adminExist._id },
        { $set: { password: hashedPassword } },
        { new: true }
      );

      if (!dataUpdated) {
        throw new HttpException(
          `Something went wrong. Couldn't change password. Please try again.`,
          HttpStatus.OK
        );
      }

      this.addLogFunction.logAdd(
        req,
        adminExist.role,
        adminExist._id,
        "ADMIN",
        "ADMIN_CHANGE_PASSWORD",
        adminExist._id,
        true,
        200,
        `${adminExist.role} ${adminExist.userName} changed password at ${currentDate}.`,
        "Password changed successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Password changed successfully.",

        data: {
          userName: adminExist.userName,
          email: adminExist.email,
          type: adminExist.role,
        },
        status: true,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData.type,
        req.userData.Id,
        "ADMIN",
        "ADMIN_CHANGE_PASSWORD",
        "",
        errData.resData.status,
        errData.statusCode,
        `ADMIN tried to request for change password with this credentials at ${moment()
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
      const matchQuery = {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
      };
      query.push(matchQuery);
      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        const role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        const roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "ADMINS"
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

      const userFound = await this.adminModel.aggregate(query);

      if (!userFound.length) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ADMIN",
        "ADMIN_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed admin ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Admin found successfully.",
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
        "ADMIN",
        "ADMIN_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view admin ${id} with this credentials at ${moment()
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
   * report for admin
   */
  //-------------------------------------------------------------------------
  async reportForAdmin(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;

      const searchKeys = ["_id", "userName", "createdAt", "updatedAt"];

      const adminQuery: { $and: any[] } = {
        $and: [{ isActive: true }, { isDeleted: false }],
      };

      let applicationQuery = null;

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
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
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
          dateFilter.start_date = moment(`${dateFilter.start_date}`)
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss");
          dateFilter.end_date = moment(`${dateFilter.end_date}`)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss");

          applicationQuery = {
            $or: [
              {
                appliedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                assignedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                verifiedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                rejectedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                generatedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                completedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
            ],
          };
        }
      }

      if (searchQuery.length > 0) {
        adminQuery.$and.push({ $or: searchQuery });
      }

      const getReport = await this.reportFunction.getAdmin(
        adminQuery,
        applicationQuery
      );
      const createData = await this.reportFunction.createData(getReport);
      const formatData = await this.reportFunction.formattedData(createData);

      if (formatData.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "ADMIN",
          "ADMIN_CHECK_REPORT",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view report odf admin at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: formatData,
          message: "Data Found successfully.",
          status: true,
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
        "ADMIN",
        "ADMIN_CHECK_REPORT",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data to view report of admin with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  /**
   * remove zip after download in application
   */
  //-------------------------------------------------------------------------
  async deleteZip(res: any, req: any) {
    try {
      const folderUrl: string = req.body.folderUrl;
      const filePathSplit = folderUrl.split("public");

      if (filePathSplit.length) {
        if (fs.existsSync(folderUrl)) {
          fs.unlinkSync(folderUrl);
        }
      }
      return res.status(200).send({
        message: "Ok.",
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
        "ADMIN",
        "ADMIN_DELETE_ZIP",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } requested to delete zip folder of  application with ${
          req.body.folderUrl
        } at ${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * report for distributor
   */
  //-------------------------------------------------------------------------
  async reportForDistributor(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;

      const searchKeys = ["_id", "name", "email", "createdAt", "updatedAt"];

      const distributorQuery: { $and: any[] } = {
        $and: [
          { isActive: true },
          { isDeleted: false },
          { isBlocked: false },
          { userType: Role.DISTRIBUTOR },
        ],
      };

      let applicationQuery = null;

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
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
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
          dateFilter.start_date = moment(`${dateFilter.start_date}`)
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss");
          dateFilter.end_date = moment(`${dateFilter.end_date}`)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss");

          applicationQuery = {
            $or: [
              {
                appliedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                assignedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                verifiedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                rejectedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                generatedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                completedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
            ],
          };
        }
      }

      if (searchQuery.length > 0) {
        distributorQuery.$and.push({ $or: searchQuery });
      }

      const getReport = await this.reportDistributor.getAdmin(
        distributorQuery,
        applicationQuery
      );
      const createData = await this.reportDistributor.createData(getReport);
      const formatData = await this.reportDistributor.formattedData(createData);

      if (formatData.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "ADMIN",
          "ADMIN_CHECK_REPORT_OF_DISTRIBUTOR",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view report of distributor at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: formatData,
          message: "Data Found successfully.",
          status: true,
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
        "ADMIN",
        "ADMIN_CHECK_REPORT_OF_DISTRIBUTOR",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data to view report of distributor with this credentials at ${moment()
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
   * report for distributor
   */
  //-------------------------------------------------------------------------
  async reportForRetailer(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const dateFilter = req.body.dateFilter;
      const searchValue = req.body.searchValue;
      let searchIn = req.body.params;

      const searchKeys = [
        "_id",
        "name",
        "mobileNumber",
        "createdAt",
        "updatedAt",
      ];

      const retailerQuery: { $and: any[] } = {
        $and: [
          { isActive: true },
          { isDeleted: false },
          { isBlocked: false },
          { userType: Role.RETAILER },
        ],
      };

      let applicationQuery = null;

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
        dateFilter !== undefined &&
        dateFilter !== null &&
        Object.keys(dateFilter).length
      ) {
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
          dateFilter.start_date = moment(`${dateFilter.start_date}`)
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss");
          dateFilter.end_date = moment(`${dateFilter.end_date}`)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss");

          applicationQuery = {
            $or: [
              {
                appliedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                assignedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                verifiedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                rejectedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                generatedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
              {
                completedOnDate: {
                  $gte: dateFilter.start_date,
                  $lte: dateFilter.end_date,
                },
              },
            ],
          };
        }
      }

      if (searchQuery.length > 0) {
        retailerQuery.$and.push({ $or: searchQuery });
      }

      const getReport = await this.reportRetailer.getAdmin(
        retailerQuery,
        applicationQuery
      );
      const createData = await this.reportRetailer.createData(getReport);
      const formatData = await this.reportRetailer.formattedData(createData);

      if (formatData.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "ADMIN",
          "ADMIN_CHECK_REPORT_OF_RETAILER",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          }filter data to view report of retailer at ${currentDate}.`,
          "Data Found successfully.",
          req.socket.remoteAddress
        );
        return res.status(200).send({
          data: formatData,
          message: "Data Found successfully.",
          status: true,
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
        "ADMIN",
        "ADMIN_CHECK_REPORT_OF_RETAILER",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data to view report of retailer with this credentials at ${moment()
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
   * find all users
   */
  //-------------------------------------------------------------------------

  async getAccessList(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const query = {
        _id: new mongoose.Types.ObjectId(req.userData.Id),
        isDeleted: false,
      };
      const dataFound = await this.adminModel.aggregate([
        { $match: { ...query } },
        {
          $lookup: {
            from: "adminroles",
            localField: "adminRoleGroupName",
            foreignField: "roleName",
            as: "roles",
          },
        },
        {
          $addFields: {
            accessModules: { $arrayElemAt: ["$roles.modules", 0] },
          },
        },
        { $unset: ["__v", "password", "roles"] },
      ]);
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "ADMIN",
        "ADMIN_ROLE_ACCESS_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of access roles at ${currentDate}.`,
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
        "ADMIN",
        "ADMIN_ROLE_ACCESS_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list access module of role with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
