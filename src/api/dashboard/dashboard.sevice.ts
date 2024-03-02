import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import * as moment from "moment";
import {
  PanApplication,
  PanDocument,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../digital-sign/entities/digital-sign.entity";
import {
  Role,
  User,
  UserDocument,
  VerifyStatus,
} from "../user/entities/user.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import { Model } from "mongoose";
import {
  Admin,
  adminDocument,
  adminType,
} from "../admin/entities/admin.entity";
import { paymentStatus } from "../transaction/entities/transaction.entity";

@Injectable()
export class DashboardService {
  [x: string]: any;
  constructor(
    private readonly addLogFunction: AddLogFunction,
    @InjectModel(PanApplication.name)
    private PanApplicationModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private ItrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private GumastaApplicationModel: Model<GumastaApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private DigitalSignModel: Model<DigitalSignDocument>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    @InjectModel(Admin.name)
    private adminModel: Model<adminDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeApplicationModel: Model<MsmeApplicationDocument>
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find all ContactInfos
   */
  //-------------------------------------------------------------------------

  async applicationCount(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const adminExist = await this.adminModel.findOne({ _id: requestedId });
      if (!adminExist) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
      }
      let query: any = { txnStatus: paymentStatus.SUCCESS };

      if (requestedType === "ADMIN") {
        query = {
          txnStatus: paymentStatus.SUCCESS,

          $or: [
            { assignedToId: requestedId },
            { assignedById: requestedId },
            { verifiedById: requestedId },
            { rejectedById: requestedId },
            { generatedById: requestedId },

            // { completedById: requestedId },
            // { moveToPendingById: requestedId },
          ],
        };
      }

      const totalPanApplications = await this.PanApplicationModel.find({
        ...query,
      }).count();
      const totalItrApplications = await this.ItrApplicationModel.find({
        ...query,
      }).count();
      const totalGumastaApplications = await this.GumastaApplicationModel.find({
        ...query,
      }).count();
      const totalDscApplications = await this.DigitalSignModel.find({
        ...query,
      }).count();
      const totalMsmeApplications = await this.msmeApplicationModel
        .find({
          ...query,
        })
        .count();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DASHBOARD",
        "DASHNOARD_APPLICATION_COUNT",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list dashboard at ${currentDate}.`,
        "Dashboard found successfully!",
        req.socket.remoteAddress
      );

      return res.status(200).send({
        message: "Application count found successfully.",
        status: true,
        data: {
          PanApplication: totalPanApplications,
          dscApplication: totalDscApplications,
          ItrApplication: totalItrApplications,
          gumastaApplication: totalGumastaApplications,
          msmeApplication: totalMsmeApplications,
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
        "DASHBOARD",
        "DASHNOARD_APPLICATION_COUNT",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || "user"} ${
          req.userData?.Id || "user"
        } check dashboard with credentials ${moment()
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
   * user's count for superadmin
   */
  //-------------------------------------------------------------------------

  async userCountForSuperAdmin(res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      const adminExist = await this.adminModel.findOne({ _id: requestedId });
      if (!adminExist && adminExist.role !== adminType.SUPER_ADMIN) {
        throw new HttpException("Invalid user.", HttpStatus.OK);
      }

      const getVerifiedDistributorCount = await this.UserModel.find({
        userType: Role.DISTRIBUTOR,
        status: VerifyStatus.VERIFIED,
        isverified: true,
        isDeleted: false,
      }).count();
      const getPendingDistributorCount = await this.UserModel.find({
        status: VerifyStatus.PENDING,
        isAppliedForDistributor: true,
        isDeleted: false,
      }).count();
      const getRetailerCount = await this.UserModel.find({
        userType: Role.RETAILER,
        role: Role.RETAILER,
        isDeleted: false,
      }).count();

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "DASHBOARD",
        "DASHNOARD_USERS_COUNT",
        "",
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ""
        } check list dashboard at ${currentDate}.`,
        "Dashboard found successfully!",
        req.socket.remoteAddress
      );

      return res.status(200).send({
        message: "Users count found successfully.",
        status: true,
        data: {
          totalVerifiedDistributor: getVerifiedDistributorCount,
          totalPendingDistributor: getPendingDistributorCount,
          totalRetailer: getRetailerCount,
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
        "DASHBOARD",
        "DASHNOARD_USERS_COUNT",
        req.userData?.Id || "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || "user"} ${
          req.userData?.Id || "user"
        } check dashboard with credentials ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
