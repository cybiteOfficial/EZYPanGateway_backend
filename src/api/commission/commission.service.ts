import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import { userAuthHelper } from "../../auth/auth.helper";
import { Commission, CommissionDocument } from "./entities/commission.entity";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import {
  CommissionUpdateHistory,
  CommissionUpdateHistoryDocument,
} from "../commission-update-history/entities/commission-update-history.entity";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import {
  CategoryDsaConfig,
  CategoryDsaConfigDocument,
} from "../category-dsa-config/entities/category-dsa-config.entity";
import {
  CategoryPcoConfig,
  CategoryPcoConfigDocument,
} from "../category-pco-config/entities/category-pco-config.entity";
import { categoryCode } from "../pan-category/entities/pan-category.entity";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import {
  UserCommission,
  UserCommissionDocument,
} from "../userCommission/entities/user-commission.entity";

@Injectable()
export class CommissionService {
  [x: string]: any;
  constructor(
    @InjectModel(Commission.name)
    private CommissionModel: Model<CommissionDocument>,
    @InjectModel(CommissionUpdateHistory.name)
    private CommissionUpdateHistoryModel: Model<CommissionUpdateHistoryDocument>,
    @InjectModel(CategoryDsaConfig.name)
    private CategoryDsaConfigModel: Model<CategoryDsaConfigDocument>,
    @InjectModel(CategoryPcoConfig.name)
    private categoryPcoConfigModel: Model<CategoryPcoConfigDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserCommission.name)
    private userCommissionModel: Model<UserCommissionDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new Commission
   */
  //-------------------------------------------------------------------------

  async add(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const result = await new this.CommissionModel({ ...req.body }).save();

      if (!result) {
        throw new HttpException("Unable to add.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "COMMISSION",
        "COMMISSION_ADD",
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added Commissions at ${currentDate}.`,
        "Data added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data added successfully.",
        status: true,
        data: result,
        code: "CREATED",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "Commission",
        "Commission_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to add Commission with this credentials at ${moment()
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
   * find all Commissions
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let query: any = {
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          isActive: true,
          isDeleted: false,
        };
      }

      const dataFound = await this.CommissionModel.find({ ...query });
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "Commission",
        "Commission_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list of Commission at ${currentDate}.`,
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
        "Commission",
        "Commission_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to list data with this credentials at ${moment()
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
   * find categories
   */
  //-------------------------------------------------------------------------

  async categoriesList(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const reqParams = ["categoryType"];

      const requiredKeys = ["categoryType"];

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

      const { categoryType } = req.body;
      let query: any = {
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          isActive: true,
          isDeleted: false,
        };
      }
      let dataFound;
      if (categoryType === categoryCode.DSA) {
        dataFound = await this.CategoryDsaConfigModel.find({ ...query });
      }
      if (categoryType === categoryCode.PCO) {
        dataFound = await this.categoryPcoConfigModel.find({ ...query });
      }
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "Commission",
        "Commission_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list of Commission at ${currentDate}.`,
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
        "Commission",
        "Commission_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to list data with this credentials at ${moment()
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
   * find Commission
   */
  //-------------------------------------------------------------------------

  async view(commissionName: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let query: any = {
        commissionName: commissionName,
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          commissionName: commissionName,
          isActive: true,
          isDeleted: false,
        };
      }

      let projectQuery = {};
      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "COMMISSIONS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const CommissionFound = await this.CommissionModel.findOne(
        { ...query },
        projectQuery
      );

      if (!CommissionFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "COMMISSION",
        "COMMISSION_VIEW",
        CommissionFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed Commission ${commissionName} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: CommissionFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "COMMISSION",
        "COMMISSION_VIEW",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to view Commission ${commissionName} with this credentials at ${moment()
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
   * update Commission
   */
  //-------------------------------------------------------------------------

  async update_by_id(commissionName: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const {
        commissionForRetailer,
        commissionForDistributor,
        commissionForGuest,
        minimumApplications,
      } = req.body;

      const reqParams = [
        "commissionForRetailer",
        "commissionForDistributor",
        "commissionForGuest",
        "minimumApplications",
      ];

      const requiredKeys = ["commissionForDistributor"];

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

      const CommissionFound = await this.CommissionModel.findOne({
        commissionName: commissionName,
        isDeleted: false,
      });
      if (!CommissionFound) {
        throw new HttpException("Commission not found.", HttpStatus.OK);
      }

      const result = await this.CommissionModel.findByIdAndUpdate(
        { _id: CommissionFound._id },
        {
          $set: { ...req.body },
        },
        { new: true }
      );

      if (!result) {
        throw new HttpException("Could not update data.", HttpStatus.OK);
      }

      const updatedHistoryData = {
        serviceName: CommissionFound.serviceName,
        commissionName: CommissionFound.commissionName,
        updatedById: req.userData.Id,
        previousCommissionForDistributor:
          CommissionFound.commissionForDistributor,
        updatedCommissionForDistributor: result.commissionForDistributor,
        minimumApplications: CommissionFound.minimumApplications,
        commissionForRetailer: CommissionFound.commissionForRetailer,
        commissionForGuest: CommissionFound.commissionForGuest,
      };

      const updatedHistoryOfCommission =
        await new this.CommissionUpdateHistoryModel({
          ...updatedHistoryData,
        }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "COMMISSION",
        "COMMISSION_UPDATE",
        CommissionFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } update Commission ${commissionName} at ${currentDate}.`,
        "Commission updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Commission updated successfully.",
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
        "COMMISSION",
        "COMMISSION_UPDATE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update Commission ${commissionName} with this credentials at ${moment()
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
   * update categories Commission
   */
  //-------------------------------------------------------------------------

  async update_categories_by_id(commissionName: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const reqParams = [
        "commissionForRetailer",
        "commissionForDistributor",
        "commissionForGuest",
        "minimumApplications",
        "commissionForDistributor",
        "categoryType",
      ];

      const requiredKeys = ["commissionForDistributor", "categoryType"];

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

      const { categoryType } = req.body;

      let CommissionFound;
      let result;
      if (categoryType == categoryCode.PCO) {
        CommissionFound = await this.categoryPcoConfigModel.findOne({
          commissionName: commissionName,
          isDeleted: false,
        });
        if (!CommissionFound) {
          throw new HttpException("Commission not found.", HttpStatus.OK);
        }

        result = await this.categoryPcoConfigModel.findByIdAndUpdate(
          { _id: CommissionFound._id },
          {
            $set: { ...req.body },
          },
          { new: true }
        );
        if (!result) {
          throw new HttpException("Could not update data.", HttpStatus.OK);
        }
      }
      if (categoryType == categoryCode.DSA) {
        CommissionFound = await this.CategoryDsaConfigModel.findOne({
          commissionName: commissionName,
          isDeleted: false,
        });

        if (!CommissionFound) {
          throw new HttpException("Commission not found.", HttpStatus.OK);
        }

        result = await this.CategoryDsaConfigModel.findByIdAndUpdate(
          { _id: CommissionFound._id },
          {
            $set: { ...req.body },
          },
          { new: true }
        );
        if (!result) {
          throw new HttpException("Could not update data.", HttpStatus.OK);
        }
      }

      const updatedHistoryData = {
        serviceName: CommissionFound.serviceName,
        commissionName: CommissionFound.commissionName,
        categoryType: categoryType,
        updatedById: requestedId,
        previousCommissionForDistributor:
          CommissionFound.commissionForDistributor,
        updatedCommissionForDistributor: result.commissionForDistributor,
        minimumApplications: CommissionFound.minimumApplications,
        commissionForRetailer: CommissionFound.commissionForRetailer,
        commissionForGuest: CommissionFound.commissionForGuest,
      };

      const updatedHistoryOfCommission =
        await new this.CommissionUpdateHistoryModel({
          ...updatedHistoryData,
        }).save();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "COMMISSION",
        "COMMISSION_UPDATE",
        CommissionFound._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } update Commission ${commissionName} at ${currentDate}.`,
        "Commission updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Commission updated successfully.",
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
        "COMMISSION",
        "COMMISSION_UPDATE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update Commission ${commissionName} with this credentials at ${moment()
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
   * remove Commission
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const CommissionFound = await this.CommissionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!CommissionFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.CommissionModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!dataUpdated) {
        throw new HttpException("Could not delete data.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "Commission",
        "Commission_DELETE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } deleted Commission ${id} at ${currentDate}.`,
        "Data deleted successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data deleted successfully.",
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
        "Commission",
        "Commission_DELETE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to delete ${id} Commission with this credentials at ${moment()
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
   * change status of Commission
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const CommissionFound = await this.CommissionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!CommissionFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = CommissionFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? "ACTIVE" : "DEACTIVE";

      const statusChanged = await this.CommissionModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isActive: activeStatus } },
        { new: true }
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "Commission",
          "Commission_CHANGE_STATUS",
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } changed status to ${statusValue} of Commission ${id} at ${currentDate}.`,
          `Status changed to ${statusValue} successfully.`,
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
        "Commission",
        "Commission_CHANGE_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to change status of Commission ${id} with this credentials at ${moment()
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
        "appliedById",
        "appliedByType",
        "appliedByName",
        "appliedByEmail",
        "appliedByMobileNumber",
        "amount",
        "applicationType",
        "applicationId",
        "commissionFor",
        "commissionTransactionType",
        "logs",
        "isActive",
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
      const numberFileds = ["rangeCode", "aoNo"];

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
          $addFields: {
            user_id: { $toObjectId: "$appliedById" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            appliedByName: { $arrayElemAt: ["$user.name", 0] },
            appliedByEmail: { $arrayElemAt: ["$user.email", 0] },
            appliedByMobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
          },
        },
        {
          $unset: ["user", "user_id"],
        },
      ];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "COMMISSIONS"
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
      const dataFound = await this.CommissionModel.aggregate(countQuery);
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

      const result = await this.CommissionModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "COMMISSION",
          "COMMISSION_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data for view Commission at ${currentDate}.`,
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
        "Commission",
        "Commission_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data of Commission with this credentials at ${moment()
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
   * update commission history
   */
  //-------------------------------------------------------------------------
  async updatedHistory(req, res) {
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
        "serviceName",
        "commissionName",
        "updatedById",
        "previousCommissionForDistributor",
        "updatedCommissionForDistributor",
        "minimumApplications",
        "commissionForRetailer",
        "commissionForGuest",
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
      const additionaQuery = [];
      countQuery.push(...additionaQuery, {
        $match: matchQuery,
      });

      //-----------------------------------
      let totalData = 0;

      /**project query for admin role */
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "COMMISSIONS"
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
      const dataFound = await this.CommissionUpdateHistoryModel.aggregate(
        countQuery
      );
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

      const result = await this.CommissionUpdateHistoryModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "COMMISSION",
          "COMMISSION_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data for view Commission at ${currentDate}.`,
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
        "Commission",
        "Commission_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to filter data of Commission with this credentials at ${moment()
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
   *create history
   */
  //-------------------------------------------------------------------------

  async addCommision(req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let { userId, applicationType, transactionType, remark } = req.body;

      let amountToBeUpdate = Number(req.body.amount);
      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can add refund transactions.",
          HttpStatus.OK
        );
      }

      /***get data */
      const userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!userFound) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const dataToInsert = {
        appliedById: userId,
        // appliedByName: appliedByName,
        appliedByType: userFound.userType,
        applicationType: applicationType,
        applicationId: "",
        commissionFor: Role.DISTRIBUTOR,
        commissionTransactionType: transactionType,
        srn: "",
        sjbtCode: userFound.sjbtCode,
      };
      const addLedger = await this.userCommissionModel.create({
        ...dataToInsert,
        amount: amountToBeUpdate,
        logs: remark,
      });

      if (!addLedger) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      return res.status(200).send({
        message: "Data added successfully.",
        status: true,
        data: addLedger,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
  //-------------------------------------------------------------------------
  /***
   *update history
   */
  //-------------------------------------------------------------------------

  async updateHistory(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let {
        userId,
        applicationType,
        transactionType,

        remark,
      } = req.body;

      let amountToBeUpdate = Number(req.body.amount);
      /***get data */
      const commissionHistoryFound = await this.userCommissionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!commissionHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update commission.",
          HttpStatus.OK
        );
      }

      /***get data */
      const userFound = await this.userModel.findOne({
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!userFound) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      const dataToInsert = {
        appliedById: userId,
        // appliedByName: appliedByName,
        appliedByType: userFound.userType,
        applicationType: applicationType,
        applicationId: "",
        commissionFor: Role.DISTRIBUTOR,
        commissionTransactionType: transactionType,
        srn: "",
        sjbtCode: userFound.sjbtCode,
      };
      const udpateCommsion = await this.userCommissionModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: { ...dataToInsert, amount: amountToBeUpdate, logs: remark },
        },
        {
          new: true,
        }
      );

      if (!udpateCommsion) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      return res.status(200).send({
        message: "Data updated successfully.",
        status: true,
        data: udpateCommsion,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
  //-------------------------------------------------------------------------
  /***
   *view
   */
  //-------------------------------------------------------------------------

  async viewAdmin(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      /***get data */

      const commissionHistoryFound = await this.userCommissionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!commissionHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: commissionHistoryFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
  //-------------------------------------------------------------------------
  /***
   *deleted history
   */
  //-------------------------------------------------------------------------

  async delete(id, req, res) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let {
        userId,
        applicationType,
        transactionType,

        remark,
      } = req.body;

      const commissionHistoryFound = await this.userCommissionModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!commissionHistoryFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      if (req.userData.type !== "SUPER_ADMIN") {
        throw new HttpException(
          "Only SUPER_ADMIN can update refund transactions.",
          HttpStatus.OK
        );
      }

      const deleteCommision = await this.userCommissionModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: { isDeleted: true },
        },
        {
          new: true,
        }
      );

      if (!deleteCommision) {
        throw new HttpException("Something went wrong.", HttpStatus.OK);
      }

      return res.status(200).send({
        message: "Data deleted successfully.",
        status: true,
        data: deleteCommision,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
