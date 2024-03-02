import { CreateFooterDto } from "./dto/create-footer.dto";
import { UpdateFooterDto } from "./dto/update-footer.dto";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Footer, FooterDocument } from "./entities/footer.entity";
import {
  FooterCategory,
  FooterCategoryDocument,
} from "../footer-category/entities/footer-category.entity";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import { userAuthHelper } from "../../auth/auth.helper";

@Injectable()
export class FooterService {
  [x: string]: any;
  constructor(
    @InjectModel(Footer.name) private FooterModel: Model<FooterDocument>,
    @InjectModel(FooterCategory.name)
    private FooterCategoryModel: Model<FooterCategoryDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper
  ) {}
  //-------------------------------------------------------------------------
  /***
   * create new Footer
   */
  //-------------------------------------------------------------------------

  async add(CreateFooterDto: CreateFooterDto, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const { footerlinks } = CreateFooterDto;

      for (const each in footerlinks) {
        const category = footerlinks[each];
        const { categoryName, links, order } = category;

        const categoryExist = await this.FooterModel.find({
          footerlinks: { $elemMatch: { categoryName: categoryName } },
        });

        if (categoryExist.length) {
          throw new HttpException(
            `Footer category already exist.`,
            HttpStatus.OK
          );
        }
      }

      const result = await new this.FooterModel(CreateFooterDto).save();

      if (!result) {
        throw new HttpException("Unable to add.", HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "FOOTER_LINK",
        "FOOTER_LINK_ADD",
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } added footer links at ${currentDate}.`,
        "Footer links added successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Footer links added successfully.",
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
        "FOOTER_LINK",
        "FOOTER_LINKADD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to add footer links with this credentials at ${moment()
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
   * find all Footers
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

      /**project query for admin role */
      let projectQuery = {};
      if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
        let accessFields = await this.userAuthHelper.getAccessFields(
          req.userData.type,
          "FOOTERS"
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK
          );
        }
        projectQuery = await this.userAuthHelper.projectQuery(accessFields);
      }

      const dataFound = await this.FooterModel.find(
        {
          ...query,
        },
        projectQuery
      );
      if (!dataFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      /**list footers order wise***/

      let footerArray = dataFound[0].footerlinks;
      footerArray.sort((a, b) => parseInt(a.order) - parseInt(b.order));

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "FOOTER_LINK",
        "FOOTER_LINKLIST",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list of footer links at ${currentDate}.`,
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
        "FOOTER_LINK",
        "FOOTER_LINK_LIST",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to check list of footer links with this credentials at ${moment()
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
   * find Footer
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

      const footerFound = await this.FooterModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $addFields: {
            categoryName: { $toObjectId: "$categoryName" },
          },
        },
        {
          $lookup: {
            from: "footercategories",
            localField: "categoryName",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$categoryData.title", 0] },
          },
        },
        {
          $unset: "categoryData",
        },
      ]);

      if (!footerFound.length) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "FOOTER_LINK",
        "FOOTER_LINK_VIEW",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } viewed footer link ${id} at ${currentDate}.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: footerFound[0],
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "FOOTER_LINK",
        "FOOTER_LINK_VIEW",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to viewed ${id} with this credentials at ${moment()
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
   * update Footer
   */
  //-------------------------------------------------------------------------

  async update_by_id(id: string, updateFooterDto: UpdateFooterDto, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const FooterFound = await this.FooterModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!FooterFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const { footerlinks } = updateFooterDto;

      const result = await this.FooterModel.findByIdAndUpdate(
        { _id: FooterFound._id },
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
        "FOOTER_LINK",
        "FOOTER_LINK_UPDATE",
        requestedId,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        }  updated footer link ${id} at ${currentDate}.`,
        "Footer links updated successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Footer links updated successfully.",
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
        "FOOTER_LINK",
        "FOOTER_LINK_UPADTE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to upadate footer links ${id} with this credentials at ${moment()
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
   * remove Footer
   */
  //-------------------------------------------------------------------------

  async delete_by_id(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const FooterFound = await this.FooterModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!FooterFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      const dataUpdated = await this.FooterModel.findByIdAndUpdate(
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
        "FOOTER_LINK",
        "FOOTER_LINK_DELETE",
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } deleted footer link ${id} at ${currentDate}.`,
        "Footer links deleted successfully.",
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
        "FOOTER_LINK",
        "FOOTER_LINK_DELETE",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to delete with this credentials at ${moment()
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
   * change status of Footer
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      const FooterFound = await this.FooterModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!FooterFound) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = FooterFound.isActive === true ? false : true;
      const statusValue = activeStatus === true ? "ACTIVE" : "DEACTIVE";

      const statusChanged = await this.FooterModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), isDeleted: false },
        { $set: { isActive: activeStatus } },
        { new: true }
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "FOOETR",
          "FOOTER_LINKS_CHANGE_STATUS",
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } changed status of footer link ${id} at ${currentDate}.`,
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
        "FOOETR",
        "FOOTER_LINKS_CHANGE_STATUS",
        "",
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ""
        }  tried to chenage status of footer link ${id} with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
