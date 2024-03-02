import { CreateMenuLinkDto } from "./dto/create-menu-link.dto";
import { UpdateMenuLinkDto } from "./dto/update-menu-link.dto";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { MenuLinks, MenuLinksDocument } from "./entities/menu-link.entity";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import { userAuthHelper } from "../../auth/auth.helper";
import { Admin, adminDocument } from "../admin/entities/admin.entity";

@Injectable()
export class MenuLinksService {
  [x: string]: any;
  constructor(
    @InjectModel(MenuLinks.name)
    private MenuLinksModel: Model<MenuLinksDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new MenuLinks
   */
  //-------------------------------------------------------------------------

  async add(CreateMenuLinksDto: CreateMenuLinkDto, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const result = await new this.MenuLinksModel(CreateMenuLinksDto).save();

      if (!result) {
        throw new HttpException("Unable to add.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MENU_LINKS",
        "MENU_LINKS_ADD",
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added menu links at ${currentDate}.`,
        "Menu links added successfully.",
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
        "MENU_LINKS",
        "MENU_LINKS_ADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to add menu links with this credentials at ${moment()
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
   * find all MenuLinkss
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

      const dataFound = await this.MenuLinksModel.find({
        ...query,
      }).sort({ order: 1 });
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MENU_LINKS",
        "MENU_LINKS_LIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } checked list of menu links at ${currentDate}.`,
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
        "MENU_LINKS",
        "MENU_LINKS_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to check list of menu links with this credentials at ${moment()
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
   * find MenuLinks
   */
  //-------------------------------------------------------------------------

  async view(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let query: any = {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      };

      if (!req.route.path.includes("/admin/")) {
        query = {
          _id: new mongoose.Types.ObjectId(id),
          isActive: true,
          isDeleted: false,
        };
      }

      /**project query for admin role */
      let projectQuery = {};
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "MENU_LINKS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const MenuLinksFound = await this.MenuLinksModel.findOne(
        {
          ...query,
        },
        projectQuery
      );
      if (!MenuLinksFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MENU_LINKS",
        "MENU_LINKS_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed menu links ${id} at ${currentDate}.`,
        "Menu links found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: MenuLinksFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "MENU_LINKS",
        "MENU_LINKS_VIEW",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to view ${id} with this credentials at ${moment()
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
   * update MenuLinks
   */
  //-------------------------------------------------------------------------

  async update_by_id(
    id: string,
    updateMenuLinksDto: UpdateMenuLinkDto,
    res,
    req
  ) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const MenuLinksFound = await this.MenuLinksModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!MenuLinksFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const result = await this.MenuLinksModel.findByIdAndUpdate(
        { _id: MenuLinksFound._id },
        {
          $set: { ...req.body },
        },
        { new: true }
      );

      if (!result) {
        throw new HttpException("Could not update data.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "MENU_LINKS",
        "MENU_LINKS_UPDATE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } updated menu links ${id} at ${currentDate}.`,
        "Menu links updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data updated successfully.",
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
        "MENU_LINKS",
        "MENU_LINKS_UPDATE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to update ${id} with this credentials at ${moment()
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
   * remove MenuLinks
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const MenuLinksFound = await this.MenuLinksModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!MenuLinksFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.MenuLinksModel.findByIdAndUpdate(
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
        "MENU_LINKS",
        "MENU_LINKS_DELETE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } deleted menu links ${id} at ${currentDate}.`,
        "Menu links deleted successfully.",
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
        "MENU_LINKS",
        "MENU_LINKS_DELETE",
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        } tried to delete ${id} with this credentials at ${moment()
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
   * change status of MenuLinks
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const MenuLinksFound = await this.MenuLinksModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!MenuLinksFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = MenuLinksFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? "ACTIVE" : "DEACTIVE";

      const statusChanged = await this.MenuLinksModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isActive: activeStatus } },
        { new: true }
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "MENU_LINKS",
          "MENU_LINKS_STATUS",
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } change status of menu links ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of menu links ${id} successfully.`,
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
        "MENU_LINKS",
        "MENU_LINKS_STATUS",
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to change status ofmenu links ${id} with this credentials at ${moment()
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
        "menuName",
        "order",
        "link",
        "isDeleted",
        "isActive",
        "createdAt",
        "updatedAt",
      ];

      const query = [];
      const filterQuery = [];
      const matchQuery: { $and: any[] } = {
        $and: [{ isDeleted: false }, { isActive: true }],
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
      const dataFound = await this.MenuLinksModel.aggregate(countQuery);
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
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          "MENU_LINKS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        let projectQuery = await this.userAuthHelper.projectQuery(accessFields);
        query.push({ $project: projectQuery });
      }

      const result = await this.MenuLinksModel.aggregate(query);
      if (result.length) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "MENU_LINKS",
          "MENU_LINKS_FILTER_PAGINATION",
          "",
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } filter data t view menu links at ${currentDate}.`,
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
        "MENU_LINKS",
        "MENU_LINKS_FILTER_PAGINATION",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to filter data of menu links with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
