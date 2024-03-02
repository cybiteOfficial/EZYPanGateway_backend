import { Model } from "mongoose";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import {
  PanApplication,
  PanDocument,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../digital-sign/entities/digital-sign.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  UserCommission,
  UserCommissionDocument,
} from "../userCommission/entities/user-commission.entity";
import * as moment from "moment";

export class sendMonthlySheetHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PanApplication.name) private panAppModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private readonly itrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly msmeApplicationModel: Model<MsmeApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private readonly dscApplicationModel: Model<DigitalSignDocument>,
    @InjectModel(GumastaApplication.name)
    private readonly gumastaApplicationModel: Model<GumastaApplicationDocument>,
    @InjectModel(UserCommission.name)
    private readonly userCommissionModel: Model<UserCommissionDocument>,
    private readonly EmailService: EmailService
  ) {}

  async getAllApplications(query) {
    let panAll = await this.panAppModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          mobileNumber: 1,
          name: 1,
          email: 1,
          srn: 1,
          appliedOnDate: 1,
          createdAt: 1,
          applicantName: "$name",
        },
      },
    ]);

    let itrAll = await this.itrApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          firstName: 1,
          email: 1,
          srn: 1,
          appliedOnDate: 1,
          createdAt: 1,
          applicantName: "$firstName",
        },
      },
    ]);

    let msmeAll = await this.msmeApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          propritorName: 1,
          email: 1,
          srn: 1,
          appliedOnDate: 1,
          createdAt: 1,
          applicantName: "$propritorName",
        },
      },
    ]);
    let dscAll = await this.dscApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          propritorName: 1,
          email: 1,
          srn: 1,
          appliedOnDate: 1,
          createdAt: 1,
          applicantName: "$propritorName",
        },
      },
    ]);
    let gumastaAll = await this.gumastaApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          propritorName: 1,
          email: 1,
          srn: 1,
          appliedOnDate: 1,
          createdAt: 1,
          applicantName: "$propritorName",
        },
      },
    ]);

    let allApplications = [
      ...panAll,
      ...itrAll,
      ...msmeAll,
      ...dscAll,
      ...gumastaAll,
    ];
    return allApplications;
  }

  async getMonthlyRetailers() {
    let currentMonth = await this.getCurrentMonthStartEndDate();
    let startDate = currentMonth.startDate;
    let EndDate = currentMonth.endDate;

    let monthlyretailers = await this.userModel.aggregate([
      {
        $match: {
          userType: Role.RETAILER,
          "allDistributor.date": { $gte: startDate, $lte: EndDate },
          isDeleted: false,
        },
      },
      {
        $project: {
          _id: 1,
          sjbtCode: 1,
          name: 1,
          mobileNumber: 1,
          email: 1,
          allDistributor: 1,
        },
      },
    ]);

    return monthlyretailers;
  }

  async getCurrentMonthStartEndDate() {
    const startOfMonth = moment()
      .startOf("month")
      .format("YYYY-MM-DD, hh:mm:ss A");
    const endOfMonth = moment().endOf("month").format("YYYY-MM-DD, hh:mm:ss A");

    return {
      startDate: startOfMonth,
      endDate: endOfMonth,
    };
  }

  async getMonthlyPanApplications(query) {
    let panApplications = await this.panAppModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          mobileNumber: 1,
          name: 1,
          email: 1,
          srn: 1,
          appliedByNumber: 1,
          appliedByType: 1,
          appliedOnDate: 1,
          applicationIndividualPrice: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ]);
    return panApplications;
  }

  async getMonthlyItrApplications(query) {
    let itrApplications = await this.itrApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          firstName: 1,
          emailId: 1,
          srn: 1,
          appliedByNumber: 1,
          appliedByType: 1,
          appliedOnDate: 1,
          applicationIndividualPrice: 1,
          status: 1,
          createdAt: 1,
          mobileNumber: 1,
          email: "$emailId",
          name: "$firstName",
        },
      },
    ]);
    return itrApplications;
  }

  async getMonthlyGumastaApplications(query) {
    let gumastaApplications = await this.gumastaApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          distributorCode: 1,
          propritorName: 1,
          mobileNumber: 1,
          email: 1,
          srn: 1,
          appliedByNumber: 1,
          appliedByType: 1,
          appliedOnDate: 1,
          applicationIndividualPrice: 1,
          status: 1,
          createdAt: 1,
          name: "$propritorName",
        },
      },
    ]);
    return gumastaApplications;
  }

  async getMonthlyDscApplications(query) {
    let dscApplications = await this.dscApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          propritorName: 1,
          distributorCode: 1,
          mobileNumber: 1,
          email: 1,
          srn: 1,
          appliedByNumber: 1,
          appliedByType: 1,
          appliedOnDate: 1,
          applicationIndividualPrice: 1,
          status: 1,
          createdAt: 1,
          name: "$propritorName",
        },
      },
    ]);
    return dscApplications;
  }

  async getMonthlyMsmeApplications(query) {
    let msmeApplications = await this.msmeApplicationModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $project: {
          _id: 1,
          propritorName: 1,
          distributorCode: 1,
          email: 1,
          mobileNumber: 1,
          srn: 1,
          appliedByNumber: 1,
          appliedByType: 1,
          appliedOnDate: 1,
          applicationIndividualPrice: 1,
          status: 1,
          createdAt: 1,
          name: "$propritorName",
        },
      },
    ]);
    return msmeApplications;
  }

  // async distributorMonthlyCommission(distributorId) {
  //   let distributorMonthlyCommision = await this.userCommissionModel.aggregate([
  //     {
  //       $match: {
  //         commissionTransactionType: 'CREDIT',
  //         appliedById: distributorId,
  //       },
  //     },
  //     {
  //       $addFields: {
  //         user_id: { $toObjectId: '$appliedById' },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'user_id',
  //         foreignField: '_id',
  //         as: 'user',
  //       },
  //     },
  //     {
  //       $addFields: {
  //         appliedByName: { $arrayElemAt: ['$user.name', 0] },
  //         appliedByEmail: { $arrayElemAt: ['$user.email', 0] },
  //         appliedByMobileNumber: {
  //           $arrayElemAt: ['$user.mobileNumber', 0],
  //         },
  //       },
  //     },
  //     {
  //       $unset: ['user', 'user_id'],
  //     },
  //     {
  //       $project: {
  //         amount: 1,
  //         commissionFor: 1,
  //         appliedByName: 1,
  //         appliedByMobileNumber: 1,
  //         appliedByEmail: 1,
  //       },
  //     },
  //   ]);
  //   return distributorMonthlyCommision;
  // }

  async distributorMonthlyCommission(query) {
    let distributorMonthlyCommision = await this.userCommissionModel.aggregate([
      {
        $match: {
          ...query,
        },
      },
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
          appliedByMobileNumber: {
            $arrayElemAt: ["$user.mobileNumber", 0],
          },
        },
      },
      {
        $unset: ["user", "user_id"],
      },
      {
        $project: {
          amount: 1,
          commissionFor: 1,
          appliedByName: 1,
          appliedByMobileNumber: 1,
          appliedByEmail: 1,
        },
      },
    ]);
    return distributorMonthlyCommision;
  }
}
