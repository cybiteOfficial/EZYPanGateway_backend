import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PanApplication,
  PanDocument,
} from '../api/panapplications/entities/pan.entity';
import { User, UserDocument } from '../api/user/entities/user.entity';
import {
  ItrApplication,
  ItrApplicationDocument,
} from '../api/itr-application/entities/itr-application.entity';
import {
  DigitalSign,
  DigitalSignDocument,
} from '../api/digital-sign/entities/digital-sign.entity';
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from '../api/msme-application/entities/msme-application.entity';
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from '../api/gumasta-application/entities/gumasta-application.entity';

export class reportDistributor {
  [x: string]: any;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PanApplication.name) private panModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name) private dscModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeModel: Model<MsmeApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private gumModel: Model<GumastaApplicationDocument>,
  ) {}

  async getAdmin(distributorQuery, applicationQuery) {
    const distributors = await this.userModel.aggregate([
      {
        $match: { ...distributorQuery },
      },
    ]);

    const dataToBeInsert = [];

    for (const each in distributors) {
      const query = { $and: [] };

      if (applicationQuery !== null) {
        query.$and.push({ ...applicationQuery });
      }

      const distributor = distributors[each];
      const distributorId = distributor._id.toString();
      const distributorName = distributor.name;
      const distributorSjbtCode = distributor.sjbtCode;

      const orQuery = {
        appliedById: distributorId,
        isDeleted: false,
      };

      query['$and'].push(orQuery);

      const getPanCounts = await this.panModel.aggregate([
        {
          $match: { ...query },
        },
        {
          $project: {
            generated: {
              $cond: [{ $eq: ['$status', 'GENERATE'] }, 1, 0],
            },
            verified: {
              $cond: [{ $eq: ['$status', 'VERIFY'] }, 1, 0],
            },
            rejected: {
              $cond: [{ $eq: ['$status', 'REJECT'] }, 1, 0],
            },
            completed: {
              $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0],
            },
            distributorName: distributorName,
            distributorSjbtCode: distributorSjbtCode,
          },
        },
        {
          $group: {
            _id: distributorId,
            distributorName: { $first: '$distributorName' },
            distributorSjbtCode: { $first: '$distributorSjbtCode' },
            panAppGeneratedCount: { $sum: '$generated' },
            panAppVerifiedCount: { $sum: '$verified' },
            panAppRejectedCount: { $sum: '$rejected' },
            panAppCompletedCount: { $sum: '$completed' },
          },
        },
      ]);

      if (getPanCounts.length == 0) {
        getPanCounts.push({
          _id: distributorId,
          distributorName: distributorName,
          distributorSjbtCode: distributorSjbtCode,
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
            generated: {
              $cond: [{ $eq: ['$status', 'GENERATE'] }, 1, 0],
            },
            verified: {
              $cond: [{ $eq: ['$status', 'VERIFY'] }, 1, 0],
            },
            rejected: {
              $cond: [{ $eq: ['$status', 'REJECT'] }, 1, 0],
            },
            completed: {
              $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0],
            },
            distributorName: distributorName,
            distributorSjbtCode: distributorSjbtCode,
          },
        },
        {
          $group: {
            _id: distributorId,
            distributorName: { $first: '$distributorName' },
            distributorSjbtCode: { $first: '$distributorSjbtCode' },
            itrAppGeneratedCount: { $sum: '$generated' },
            itrAppVerifiedCount: { $sum: '$verified' },
            itrAppRejectedCount: { $sum: '$rejected' },
            itrAppCompletedCount: { $sum: '$completed' },
          },
        },
      ]);

      if (getItrCounts.length == 0) {
        getItrCounts.push({
          _id: distributorId,
          distributorName: distributorName,
          distributorSjbtCode: distributorSjbtCode,
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
            generated: {
              $cond: [{ $eq: ['$status', 'GENERATE'] }, 1, 0],
            },
            verified: {
              $cond: [{ $eq: ['$status', 'VERIFY'] }, 1, 0],
            },
            rejected: {
              $cond: [{ $eq: ['$status', 'REJECT'] }, 1, 0],
            },
            completed: {
              $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0],
            },
            distributorName: distributorName,
            distributorSjbtCode: distributorSjbtCode,
          },
        },
        {
          $group: {
            _id: distributorId,
            distributorName: { $first: '$distributorName' },
            distributorSjbtCode: { $first: '$distributorSjbtCode' },
            dscAppGeneratedCount: { $sum: '$generated' },
            dscAppVerifiedCount: { $sum: '$verified' },
            dscAppRejectedCount: { $sum: '$rejected' },
            dscAppCompletedCount: { $sum: '$completed' },
          },
        },
      ]);

      if (getDscCounts.length == 0) {
        getDscCounts.push({
          _id: distributorId,
          distributorName: distributorName,
          distributorSjbtCode: distributorSjbtCode,
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
            generated: {
              $cond: [{ $eq: ['$status', 'GENERATE'] }, 1, 0],
            },
            verified: {
              $cond: [{ $eq: ['$status', 'VERIFY'] }, 1, 0],
            },
            rejected: {
              $cond: [{ $eq: ['$status', 'REJECT'] }, 1, 0],
            },
            completed: {
              $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0],
            },
            distributorName: distributorName,
            distributorSjbtCode: distributorSjbtCode,
          },
        },
        {
          $group: {
            _id: distributorId,
            distributorName: { $first: '$distributorName' },
            distributorSjbtCode: { $first: '$distributorSjbtCode' },
            msmeAppGeneratedCount: { $sum: '$generated' },
            msmeAppVerifiedCount: { $sum: '$verified' },
            msmeAppRejectedCount: { $sum: '$rejected' },
            msmeAppCompletedCount: { $sum: '$completed' },
          },
        },
      ]);

      if (getMsmeCounts.length == 0) {
        getMsmeCounts.push({
          _id: distributorId,
          distributorName: distributorName,
          distributorSjbtCode: distributorSjbtCode,
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
            generated: {
              $cond: [{ $eq: ['$status', 'GENERATE'] }, 1, 0],
            },
            verified: {
              $cond: [{ $eq: ['$status', 'VERIFY'] }, 1, 0],
            },
            rejected: {
              $cond: [{ $eq: ['$status', 'REJECT'] }, 1, 0],
            },
            completed: {
              $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0],
            },
            distributorName: distributorName,
            distributorSjbtCode: distributorSjbtCode,
          },
        },
        {
          $group: {
            _id: distributorId,
            distributorName: { $first: '$distributorName' },
            distributorSjbtCode: { $first: '$distributorSjbtCode' },
            gumastaAppGeneratedCount: { $sum: '$generated' },
            gumastaAppVerifiedCount: { $sum: '$verified' },
            gumastaAppRejectedCount: { $sum: '$rejected' },
            gumastaAppCompletedCount: { $sum: '$completed' },
          },
        },
      ]);

      if (getGumCounts.length == 0) {
        getGumCounts.push({
          _id: distributorId,
          distributorName: distributorName,
          distributorSjbtCode: distributorSjbtCode,
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
        ...getGumCounts,
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
          (object) => object._id === data._id,
        );

        if (existingObject) {
          Object.keys(data).forEach((key) => {
            if (key !== '_id') {
              existingObject[key] = data[key];
            }
          });
        } else {
          const newObject = { _id: data._id };

          Object.keys(data).forEach((key) => {
            if (key !== '_id') {
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
      dataToBeInsertArr,
    );

    return getApplicationCount;
  }

  async formattedData(createData: any[]) {
    return createData?.map((data) => {
      return {
        _id: data?._id,
        distributorName: data?.distributorName,
        distributorSjbtCode: data?.distributorSjbtCode,
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
