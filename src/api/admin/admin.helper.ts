import { Admin, adminDocument } from './entities/admin.entity';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

export class adminHelper {
  [x: string]: any;
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
  ) {}

  async getAccessKey(status: string) {
    switch (status) {
      case 'PAYMENT_PENDING':
        return null;
        break;
      case 'PENDING':
        return null;
        break;
      case 'IN_PROGRESS':
        return 'assignedToId';
        break;
      case 'VERIFY':
        return 'verifiedById';
        break;
      case 'REJECT':
        return 'rejectedById';
        break;
      case 'GENERATE':
        return 'generatedById';
        break;
      case 'DONE':
        return 'completedById';
        break;
      case 'CANCELLED':
        return 'cancelledById';
        break;
    }
  }

  async checkVerifiedStatus(
    accessKey: string,
    adminId: string,
    applicationType: string,
    status: string,
    applicationAccess: { status: string; applicationType: string }[],
  ) {
    const statusFoundInUserAccess = applicationAccess.find((ele) => {
      return ele.status === status && ele.applicationType === applicationType;
    });

    if (statusFoundInUserAccess) {
      if (status === 'VERIFY') {
        const generateStatusCheck = applicationAccess.find((ele) => {
          return (
            ele.status === 'GENERATE' && ele.applicationType === applicationType
          );
        });

        if (!generateStatusCheck) {
          return {
            status: true,
            data: { [accessKey]: adminId },
            message: 'OK',
          };
        } else {
          return {
            status: true,
            data: null,
            message: 'OK',
          };
        }
      } else {
        return {
          status: true,
          data: { [accessKey]: adminId },
          message: 'OK',
        };
      }
    } else {
      return {
        status: false,
        data: null,
        message: 'You do not have access',
      };
    }
  }

  async getAdminApplicationAcces(
    adminId: any,
    applicationType: any,
    status: any,
  ) {
    try {
      const dataFound = await this.adminModel.findOne({
        _id: adminId,
        isDeleted: false,
      });
      if (!dataFound) {
        return {
          message: 'Admin details not found.',
          status: false,
          data: null,
        };
      }
      if (
        (!dataFound.applicationStatusAccess ||
          !Array.isArray(dataFound.applicationStatusAccess)) &&
        dataFound.role !== 'SUPER_ADMIN'
      ) {
        return {
          message: 'You do not have authority to access application.',
          status: false,
          data: null,
        };
      }
      const applicationAccess = dataFound.applicationStatusAccess;
      const dataToSend = [];

      if (applicationAccess && Array.isArray(applicationAccess)) {
        if (Array.isArray(status)) {
          for (const each in status) {
            if (
              status[each] !== 'PENDING' &&
              status[each] !== 'PAYMENT_PENDING' &&
              dataFound.role !== 'SUPER_ADMIN'
            ) {
              const accessKey = await this.getAccessKey(status[each]);
              const accessCheckObj = await this.checkVerifiedStatus(
                accessKey,
                adminId,
                applicationType,
                status[each],
                applicationAccess,
              );

              if (accessCheckObj.status) {
                if (accessCheckObj.data !== null) {
                  dataToSend.push({ ...accessCheckObj.data });
                }
              } else {
                return {
                  message: accessCheckObj.message,
                  status: false,
                  data: null,
                };
              }
            }
          }
        } else {
          const accessKey = await this.getAccessKey(status);

          const accessCheckObj = await this.checkVerifiedStatus(
            accessKey,
            adminId,
            applicationType,
            status,
            applicationAccess,
          );
          if (accessCheckObj && accessCheckObj.status) {
            if (accessCheckObj.data !== null) {
              dataToSend.push({ ...accessCheckObj.data });
            }
          } else {
            return {
              message: accessCheckObj.message,
              status: false,
              data: null,
            };
          }
        }
      }

      return {
        message: 'All Ok',
        status: true,
        data: dataToSend,
      };
    } catch (err) {
      return {
        message:
          'Some error occured while checking your access with this application. Please check your access or contact administrator.',
        status: false,
        data: null,
      };
    }
  }

  async checkAccessForUpdateStatus(
    req: any,
    applicationType: string,
    applicationStatusAccess: { status: string; applicationType: string }[],
  ): Promise<{ status: boolean; data: any; message: string }> {
    const checkApplicationAccess = applicationStatusAccess.find((ele) => {
      return (
        ele.applicationType === applicationType &&
        ele.status === req.body.requestedStatus
      );
    });

    if (
      !checkApplicationAccess ||
      checkApplicationAccess === null ||
      checkApplicationAccess === undefined
    ) {
      return {
        status: false,
        data: null,
        message: `You don't have permission to update this application.`,
      };
    } else {
      return {
        status: true,
        data: null,
        message: 'All good.',
      };
    }
  }
}
