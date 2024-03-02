import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  PanApplication,
  PanDocument,
  status,
} from "../api/panapplications/entities/pan.entity";
import { Admin, adminDocument } from "../api/admin/entities/admin.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../api/itr-application/entities/itr-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../api/digital-sign/entities/digital-sign.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../api/msme-application/entities/msme-application.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../api/gumasta-application/entities/gumasta-application.entity";

export class reportAdmin {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(PanApplication.name) private panModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name) private dscModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeModel: Model<MsmeApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private gumModel: Model<GumastaApplicationDocument>
  ) {}

  async getAdmin(adminQuery, applicationQuery) {
    const admins = await this.adminModel.aggregate([
      {
        $match: { ...adminQuery },
      },
    ]);

    const dataToBeInsert = [];

    for (const each in admins) {
      const query = { $and: [] };
      query.$and.push({ isDeleted: false });

      if (applicationQuery !== null) {
        query.$and.push({ ...applicationQuery });
      }

      const admin = admins[each];
      const adminId = admin._id.toString();
      const adminName = admin.userName;

      const orQuery = {
        // isDeleted: false,
        $or: [
          // {
          //   generatedById: adminId,
          //   status: status.GENERATE,
          //   completedById: { $nin: [adminId] },
          //   rejectedById: { $nin: [adminId] },
          //   verifiedById: { $nin: [adminId] },
          // },
          // {
          //   verifiedById: adminId,
          //   status: status.VERIFY,
          //   completedById: { $nin: [adminId] },
          //   rejectedById: { $nin: [adminId] },
          //   generatedById: { $nin: [adminId] },
          // },
          // {
          //   rejectedById: adminId,
          //   status: status.REJECT,
          //   completedById: { $nin: [adminId] },
          //   verifiedById: { $nin: [adminId] },
          //   generatedById: { $nin: [adminId] },
          // },
          // {
          //   completedById: adminId,
          //   status: status.DONE,
          //   verifiedById: { $nin: [adminId] },
          //   rejectedById: { $nin: [adminId] },
          //   generatedById: { $nin: [adminId] },
          // },

          {
            $or: [
              { generatedById: adminId },
              { completedById: adminId },
              { rejectedById: adminId },
              { verifiedById: adminId },
            ],
          },
        ],
      };

      query["$and"].push({ ...orQuery });

      const getPanCounts = await this.panModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generatedById: {
              $cond: [{ $eq: ["$generatedById", adminId] }, 1, 0],
            },
            verifiedById: {
              $cond: [{ $eq: ["$verifiedById", adminId] }, 1, 0],
            },
            rejectedById: {
              $cond: [{ $eq: ["$rejectedById", adminId] }, 1, 0],
            },
            completedById: {
              $cond: [{ $eq: ["$completedById", adminId] }, 1, 0],
            },
            adminName: adminName,
          },
        },
        {
          $group: {
            _id: adminId,
            adminName: { $first: "$adminName" },
            panAppGeneratedCount: { $sum: "$generatedById" },
            panAppVerifiedCount: { $sum: "$verifiedById" },
            panAppRejectedCount: { $sum: "$rejectedById" },
            panAppCompletedCount: { $sum: "$completedById" },
          },
        },
      ]);

      if (getPanCounts.length == 0) {
        getPanCounts.push({
          _id: adminId,
          adminName: adminName,
          panAppGeneratedCount: 0,
          panAppVerifiedCount: 0,
          panAppRejectedCount: 0,
          panAppCompletedCount: 0,
        });
      }

      const getItrCounts = await this.itrModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generatedById: {
              $cond: [{ $eq: ["$generatedById", adminId] }, 1, 0],
            },
            verifiedById: {
              $cond: [{ $eq: ["$verifiedById", adminId] }, 1, 0],
            },
            rejectedById: {
              $cond: [{ $eq: ["$rejectedById", adminId] }, 1, 0],
            },
            completedById: {
              $cond: [{ $eq: ["$completedById", adminId] }, 1, 0],
            },
            adminName: adminName,
          },
        },
        {
          $group: {
            _id: adminId,
            adminName: { $first: "adminName" },
            itrAppGeneratedCount: { $sum: "$generatedById" },
            itrAppVerifiedCount: { $sum: "$verifiedById" },
            itrAppRejectedCount: { $sum: "$rejectedById" },
            itrAppCompletedCount: { $sum: "$completedById" },
          },
        },
      ]);

      if (getItrCounts.length == 0) {
        getItrCounts.push({
          _id: adminId,
          adminName: adminName,
          itrAppGeneratedCount: 0,
          itrAppVerifiedCount: 0,
          itrAppRejectedCount: 0,
          itrAppCompletedCount: 0,
        });
      }

      const getDscCounts = await this.dscModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generatedById: {
              $cond: [{ $eq: ["$generatedById", adminId] }, 1, 0],
            },
            verifiedById: {
              $cond: [{ $eq: ["$verifiedById", adminId] }, 1, 0],
            },
            rejectedById: {
              $cond: [{ $eq: ["$rejectedById", adminId] }, 1, 0],
            },
            completedById: {
              $cond: [{ $eq: ["$completedById", adminId] }, 1, 0],
            },
            adminName: adminName,
          },
        },
        {
          $group: {
            _id: adminId,
            adminName: { $first: "$adminName" },
            dscAppGeneratedCount: { $sum: "$generatedById" },
            dscAppVerifiedCount: { $sum: "$verifiedById" },
            dscAppRejectedCount: { $sum: "$rejectedById" },
            dscAppCompletedCount: { $sum: "$completedById" },
          },
        },
      ]);

      if (getDscCounts.length == 0) {
        getDscCounts.push({
          _id: adminId,
          adminName: adminName,
          dscAppGeneratedCount: 0,
          dscAppVerifiedCount: 0,
          dscAppRejectedCount: 0,
          dscAppCompletedCount: 0,
        });
      }

      const getMsmeCounts = await this.msmeModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generatedById: {
              $cond: [{ $eq: ["$generatedById", adminId] }, 1, 0],
            },
            verifiedById: {
              $cond: [{ $eq: ["$verifiedById", adminId] }, 1, 0],
            },
            rejectedById: {
              $cond: [{ $eq: ["$rejectedById", adminId] }, 1, 0],
            },
            completedById: {
              $cond: [{ $eq: ["$completedById", adminId] }, 1, 0],
            },
            adminName: adminName,
          },
        },
        {
          $group: {
            _id: adminId,
            adminName: { $first: "adminName" },
            msmeAppGeneratedCount: { $sum: "$generatedById" },
            msmeAppVerifiedCount: { $sum: "$verifiedById" },
            msmeAppRejectedCount: { $sum: "$rejectedById" },
            msmeAppCompletedCount: { $sum: "$completedById" },
          },
        },
      ]);

      if (getMsmeCounts.length == 0) {
        getMsmeCounts.push({
          _id: adminId,
          adminName: adminName,
          msmeAppGeneratedCount: 0,
          msmeAppVerifiedCount: 0,
          msmeAppRejectedCount: 0,
          msmeAppCompletedCount: 0,
        });
      }

      const getGumCounts = await this.gumModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generatedById: {
              $cond: [{ $eq: ["$generatedById", adminId] }, 1, 0],
            },
            verifiedById: {
              $cond: [{ $eq: ["$verifiedById", adminId] }, 1, 0],
            },
            rejectedById: {
              $cond: [{ $eq: ["$rejectedById", adminId] }, 1, 0],
            },
            completedById: {
              $cond: [{ $eq: ["$completedById", adminId] }, 1, 0],
            },
            adminName: adminName,
          },
        },
        {
          $group: {
            _id: adminId,
            adminName: { $first: "$adminName" },
            gumastaAppGeneratedCount: { $sum: "$generatedById" },
            gumastaAppVerifiedCount: { $sum: "$verifiedById" },
            gumastaAppRejectedCount: { $sum: "$rejectedById" },
            gumastaAppCompletedCount: { $sum: "$completedById" },
          },
        },
      ]);

      if (getGumCounts.length == 0) {
        getGumCounts.push({
          _id: adminId,
          adminName: adminName,
          gumastaAppGeneratedCount: 0,
          gumastaAppVerifiedCount: 0,
          gumastaAppRejectedCount: 0,
          gumastaAppCompletedCount: 0,
        });
      }

      dataToBeInsert.push(
        ...getPanCounts,
        ...getItrCounts,
        ...getDscCounts,
        ...getMsmeCounts,
        ...getGumCounts
      );
    }

    return dataToBeInsert;
  }

  async createData(dataToBeInsertArr: any[]) {
    const blankArray = [];

    function getAppDataAdminWise(blankArray, dataToBeInsertArr) {
      const accumulator = blankArray.slice();

      dataToBeInsertArr.forEach((data) => {
        const existingObject = accumulator.find(
          (object) => object._id === data._id
        );

        if (existingObject) {
          Object.keys(data).forEach((key) => {
            if (key !== "_id") {
              existingObject[key] = data[key];
            }
          });
        } else {
          const newObject = { _id: data._id };

          Object.keys(data).forEach((key) => {
            if (key !== "_id") {
              newObject[key] = data[key];
            }
          });
          accumulator.push(newObject);
        }
      });
      return accumulator;
    }

    const getApplicationCount = getAppDataAdminWise(
      blankArray,
      dataToBeInsertArr
    );

    return getApplicationCount;
  }

  async formattedData(createData: any[]) {
    return createData?.map((data) => {
      return {
        _id: data?._id,
        adminName: data?.adminName,
        pan: {
          generate: data?.panAppGeneratedCount,
          verified: data?.panAppVerifiedCount,
          rejected: data?.panAppRejectedCount,
          done: data?.panAppCompletedCount,
        },
        itr: {
          generate: data?.itrAppGeneratedCount,
          verified: data?.itrAppVerifiedCount,
          rejected: data?.itrAppRejectedCount,
          done: data?.itrAppCompletedCount,
        },
        gumasta: {
          generate: data?.gumastaAppGeneratedCount,
          verified: data?.gumastaAppVerifiedCount,
          rejected: data?.gumastaAppRejectedCount,
          done: data?.gumastaAppCompletedCount,
        },
        dsc: {
          generate: data?.dscAppGeneratedCount,
          verified: data?.dscAppVerifiedCount,
          rejected: data?.dscAppRejectedCount,
          done: data?.dscAppCompletedCount,
        },
        msme: {
          generate: data?.msmeAppGeneratedCount,
          verified: data?.msmeAppVerifiedCount,
          rejected: data?.msmeAppRejectedCount,
          done: data?.msmeAppCompletedCount,
        },
      };
    });
  }
}
