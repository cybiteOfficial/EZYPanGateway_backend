import {
  AllAccessFields,
  AllAccessFieldsDocument,
} from "../api/all-access-fields/entites/all-access-module.entity";
import {
  AdminRole,
  AdminRoleDocument,
} from "../api/adminrole/entities/adminrole.entity";
import { AdminRoleModule } from "../api/adminrole/adminrole.module";
import {
  User,
  UserDocument,
  VerifyStatus,
} from "../api/user/entities/user.entity";
import { Admin, adminDocument } from "../api/admin/entities/admin.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Role } from "../api/user/entities/user.entity";
import * as jwt from "jsonwebtoken";
import { Client } from "../helper/initRedis";
import { SubscriptionType } from "../api/subscription-flow/entities/subscription-flow.entity";
import * as moment from "moment";
import { AccessModule } from "src/api/accessmodule/access-module.module";
import { AccessModuleDocument } from "src/api/accessmodule/entities/access-module.entity";

export class userAuthHelper {
  @InjectModel(Admin.name) private adminModel: Model<adminDocument>;
  @InjectModel(User.name) private userModel: Model<UserDocument>;
  @InjectModel(AdminRole.name) private AdminRoleModel: Model<AdminRoleDocument>;
  @InjectModel(AllAccessFields.name)
  private AllAccessFieldsModel: Model<AllAccessFieldsDocument>;

  async userAccessFunc(
    userId: string,
    requestedUrl: string,
    requestedMethod: string
  ) {
    let resToSend = { status: false };
    const query = {
      _id: new mongoose.Types.ObjectId(userId),
    };
    const result = await this.adminModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $lookup: {
          from: "adminroles",
          localField: "role",
          foreignField: "roleName",
          as: "adminroles",
        },
      },

      {
        $addFields: { modules: { $arrayElemAt: ["$adminroles.modules", 0] } },
      },
      {
        $unset: "adminroles",
      },
      { $unwind: "$modules" },
      { $unwind: "$modules.actions" },

      {
        $lookup: {
          from: "accessmodules",
          //   localField: 'modules.moduleGroup',
          //   foreignField: 'moduleGroup',
          let: {
            module: "$modules",
            action: "$modules.actions",
          },
          as: "accessModules",
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$moduleGroup", "$$module.moduleGroup"] } },
                  //   { $expr: { $in: ['moduleName', '$$module.actions'] } },
                  { $expr: { $eq: ["$moduleName", "$$action"] } },
                ],
              },
            },
            {
              $project: {
                url: 1,
                method: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$accessModules" },
      {
        $group: {
          _id: "$_id",
          access_modules: { $addToSet: "$accessModules" },
        },
      },
    ]);
    if (result.length) {
      const accessModules = result[0].access_modules;
      const matchUrl = accessModules.find(
        (module) =>
          module.method === requestedMethod && module.url === requestedUrl
      );
      if (matchUrl) {
        resToSend = { status: true };
      } else {
        resToSend = { status: false };
      }
    } else {
      resToSend = { status: false };
    }
    return resToSend;
  }

  async webAccessFunc(
    userId: string,
    requestedUrl: string,
    requestedMethod: string
  ) {
    let resToSend = { status: false };
    const query = {
      _id: new mongoose.Types.ObjectId(userId),
    };
    const result = await this.userModel.aggregate([
      {
        $match: { ...query },
      },
      {
        $unwind: "$roleId",
      },
      {
        $lookup: {
          from: "adminroles",
          localField: "roleId",
          foreignField: "_id",
          as: "adminroles",
        },
      },
      {
        $addFields: { modules: { $arrayElemAt: ["$adminroles.modules", 0] } },
      },
      {
        $unset: "adminroles",
      },
      { $unwind: "$modules" },
      { $unwind: "$modules.actions" },

      {
        $lookup: {
          from: "accessmodules",
          //   localField: 'modules.moduleGroup',
          //   foreignField: 'moduleGroup',
          let: {
            module: "$modules",
            action: "$modules.actions",
          },
          as: "accessModules",
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$moduleGroup", "$$module.moduleGroup"] } },
                  //   { $expr: { $in: ['moduleName', '$$module.actions'] } },
                  { $expr: { $eq: ["$moduleName", "$$action"] } },
                ],
              },
            },
            {
              $project: {
                url: 1,
                method: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$accessModules" },
      {
        $group: {
          _id: "$_id",
          access_modules: { $addToSet: "$accessModules" },
        },
      },
    ]);
    if (result.length) {
      const accessModules = result[0].access_modules;
      const matchUrl = accessModules.find(
        (module) =>
          module.method === requestedMethod && module.url === requestedUrl
      );
      if (matchUrl) {
        resToSend = { status: true };
      } else {
        resToSend = { status: false };
      }
    } else {
      resToSend = { status: false };
    }
    return resToSend;
  }

  async getAccessFields(userType, module_group) {
    const result = await this.AdminRoleModel.aggregate([
      {
        $match: {
          roleName: userType,
        },
      },
      {
        $unwind: "$modules",
      },
      {
        $addFields: {
          module_group: "$modules.moduleGroup",
        },
      },
      {
        $match: {
          module_group: module_group,
        },
      },
      {
        $lookup: {
          from: "allaccessfields",
          localField: module_group,
          foreignField: module_group,
          as: "accessfields",
          pipeline: [
            {
              $match: {
                moduleGroup: module_group,
              },
            },
            {
              $project: {
                default_fields: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$accessfields",
      },
      {
        $project: {
          fields: "$modules.fields.fieldName",
          default_fields: "$accessfields.default_fields",
        },
      },
    ]);
    return result;
  }

  async AccTokenDecode(req) {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];
    const decoded = jwt.verify(token, process.env.SEC_KEY_ACC) as {
      [key: string]: any;
    };

    return decoded;
  }

  async RefreshTokenDecode(req) {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];
    const permission = [];
    const decoded = jwt.verify(token, process.env.SEC_KEY_REF) as {
      [key: string]: any;
    };

    return decoded;
  }

  // async projectQuery(accessFields) {
  //   let projectQuery = null;
  //   if (Array.isArray(accessFields)) {
  //     projectQuery = accessFields.reduce((acc, ele) => {
  //       acc[`${ele}`] = 1;
  //       return acc;
  //     }, {});
  //   }
  //   return projectQuery;
  // }

  async projectQuery(accessFields) {
    const projectData = {};
    if (Array.isArray(accessFields)) {
      if (accessFields && accessFields[0] !== undefined) {
        if (accessFields[0].fields && accessFields[0].fields !== undefined) {
          accessFields[0].fields.map((e) => {
            projectData[e] = 1;
          });
        }
        if (
          accessFields[0].default_fields &&
          accessFields[0].default_fields !== undefined
        ) {
          accessFields[0].default_fields.map((e) => {
            projectData[e] = 1;
          });
        }
      }
    }
    return projectData;
  }

  async getAllRoles() {
    const allRoleData = await this.AdminRoleModel.find({}, { roleName: 1 });
    if (allRoleData && allRoleData.length) {
      const allRolesArray = [];
      const allRolesFound = allRoleData.reduce((acc, ele) => {
        if (acc.length && !acc.includes(ele.roleName)) {
          acc.push(ele.roleName);
        }
        return acc;
      }, allRolesArray);
      const allRoles = allRolesFound.length
        ? allRolesFound
        : process.env.ALL_USER_TYPES.split(",");
      return allRoles;
    }
  }

  async AdminExistCheck(req: any) {
    const adminExist = await this.adminModel.findOne({
      _id: req.userData.Id,
      isDeleted: false,
      isActive: true,
    });

    return adminExist ? adminExist : null;
  }

  async tokenExistCheck(req) {
    if (
      !req ||
      !req.headers ||
      !req.headers["x-access-token"] ||
      req.headers["x-access-token"] === undefined ||
      req.headers["x-access-token"] === null ||
      req.headers["x-access-token"] === ""
    ) {
      return false;
    } else {
      return true;
    }
  }

  async UserExistCheck(req: any) {
    const userExist = await this.userModel.findOne({
      _id: req.userData.Id,
      isDeleted: false,
    });
    return userExist ? userExist : null;
  }

  async retailerProfileCompleteCheck(
    userData: any,
    reqUrl: string,
    reqMethod: string
  ) {
    userData = JSON.parse(JSON.stringify(userData));

    if (
      userData.isProfileComplete &&
      userData.email !== "" &&
      userData.name !== "" &&
      userData.mobileNumber !== "" &&
      userData.dob !== ""
    ) {
      return {
        status: true,
        resToSend: null,
      };
    } else {
      if (
        (reqMethod.toLowerCase() === "put" &&
          reqUrl.toLowerCase() === "/retailer/update-profile") ||
        (reqMethod.toLowerCase() === "get" &&
          reqUrl.toLowerCase() === "/retailer/retailer-profile")
      ) {
        return {
          status: true,
          resToSend: null,
        };
      } else {
        return {
          status: false,
          resToSend: {
            message: "You do not have permission to access this.",
            code: "PROFILE_NOT_COMPLETE.",
            issue: "AUTHORIZATION_FAILED",
            status: false,
            data: null,
          },
        };
      }
    }
  }

  async userActiveCheck(userData: any) {
    userData = JSON.parse(JSON.stringify(userData));
    if (userData.isActive) {
      return {
        status: true,
        resToSend: null,
      };
    } else {
      return {
        status: false,
        resToSend: {
          message: "You do not have permission to access this.",
          code: "USER_NOT_ACTIVE.",
          issue: "AUTHORIZATION_FAILED",
          status: false,
          data: null,
        },
      };
    }
  }

  async userBlockedCheck(userData: any) {
    userData = JSON.parse(JSON.stringify(userData));

    if (userData.isBlocked) {
      return {
        status: false,
        resToSend: {
          message: "Your profile is blocked.",
          code: "USER_BLOCKED.",
          issue: "AUTHORIZATION_FAILED",
          status: false,
          data: null,
        },
      };
    } else {
      return {
        status: true,
        resToSend: null,
      };
    }
  }

  async userVerifiedCheck(userData: any, userType: string) {
    userData = JSON.parse(JSON.stringify(userData));

    if (userType === Role.DISTRIBUTOR && !userData.isVerified) {
      return {
        status: false,
        resToSend: {
          message: "Your profile is not verified.please login as a guest.",
          code: "USER_NOT_VERIFIED.",
          issue: "AUTHORIZATION_FAILED",
          status: false,
          data: null,
        },
      };
    } else {
      return {
        status: true,
        resToSend: null,
      };
    }
  }

  async userRejectCheck(userData: any) {
    userData = JSON.parse(JSON.stringify(userData));

    if (
      userData.status == VerifyStatus.REJECTED &&
      !userData.isAppliedForDistributor &&
      userData.userType == Role.DISTRIBUTOR
    ) {
      return {
        status: false,
        resToSend: {
          message: "Your profile is rejected.",
          code: "USER_REJECTED.",
          issue: "AUTHORIZATION_FAILED",
          status: false,
          data: null,
        },
      };
    } else {
      return {
        status: true,
        resToSend: null,
      };
    }
  }

  async AccessCheck(userData: any, reqMethod: string, reqUrl: string) {
    let resToSend: { status: boolean; fields: any } = {
      status: false,
      fields: null,
    };
    const allowedAccess = await this.AdminRoleModel.aggregate([
      {
        $match: {
          roleName: userData.roleName,
        },
      },
      { $unwind: "$modules" },
      { $unwind: "$modules.actions" },
      {
        $addFields: {
          moduleGroup: "$modules.moduleGroup",
          moduleName: "$modules.actions",
          accessFields: "$modules.fields",
        },
      },
      { $unset: "modules" },
      {
        $lookup: {
          from: "accessmodules",
          let: {
            module_group: "$moduleGroup",
            module_name: "$moduleName",
          },
          as: "allmodules",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$moduleName", "$$module_name"] },
                    { $eq: ["$moduleGroup", "$$module_group"] },
                  ],
                },
              },
            },
            {
              $project: {
                moduleName: 1,
                moduleGroup: 1,
                method: 1,
                url: 1,
              },
            },
          ],
        },
      },

      { $unwind: "$allmodules" },
      {
        $group: {
          _id: "$_id",
          access_modules: { $addToSet: "$allmodules" },
          acccesssFields: { $first: "$accessFields" },
        },
      },
    ]);

    if (
      allowedAccess &&
      allowedAccess.length &&
      allowedAccess[0].access_modules &&
      allowedAccess[0].access_modules.length
    ) {
      const accessModules = allowedAccess[0].access_modules;

      reqUrl = reqUrl.toUpperCase();
      reqMethod = reqMethod.toUpperCase();
      const matchedUrl = accessModules.find((module: any) => {
        return (
          module.method.toUpperCase() === reqMethod &&
          module.url.toUpperCase() === reqUrl
        );
      });

      if (matchedUrl) {
        resToSend = {
          status: true,
          fields: allowedAccess[0].acccesssFields,
        };
      }
    } else {
      console.log("not matched");

      resToSend = {
        status: false,
        fields: null,
      };
    }

    return resToSend;
  }

  async checkTokenType(req: any) {
    if (!req.userData) {
      return false;
    }
    if (
      req.userData.token_type === undefined ||
      req.userData.token_type === "" ||
      req.userData.token_type !== "LOGIN"
    ) {
      return false;
    } else {
      return true;
    }
  }

  async checkAccessTokenInRedis(req: any) {
    const tokenKey = `${req.userData.Id}*`;
    const keys = await new Promise<string[]>((resolve, reject) => {
      Client.KEYS(tokenKey, (err, keys) => {
        if (err) {
          reject(err);
        } else {
          resolve(keys);
        }
      });
    });

    if (!keys || keys.length === 0) {
      return {
        status: false,
        resToSend: {
          message: "Something went wrong.",
          code: "INVALID_TOKEN",
          issue: "AUTHENTICATION_FAILED",
          status: false,
          data: null,
        },
      };
    }

    for (const key of keys) {
      const tokenValue = await new Promise<string>((resolve, reject) => {
        Client.GET(key, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      if (tokenValue && tokenValue.includes(req.headers["x-access-token"])) {
        return {
          status: true,
          resToSend: null,
        };
      }
    }

    return {
      status: false,
      resToSend: {
        message: "Authentication failed.",
        code: "INVALID_TOKEN",
        issue: "AUTHENTICATION_FAILED",
        status: false,
        data: null,
      },
    };
  }

  async checkUserSubscription(
    userSubscriptionId: string,
    userSubscriptionExpiry: string,
    userSubscriptionPlanName: string
  ) {
    // If the user has no subscription
    // if (userSubscriptionId === '') {
    //   return {
    //     status: true,
    //     resToSend: {
    //       message: `You don't have any subscription plan. Please login as a guest.`,
    //       status: false,
    //       data: null,
    //     },
    //   };
    // }

    // If the user has a lifetime subscription
    if (userSubscriptionPlanName === SubscriptionType.LIFETIME) {
      return {
        status: true,
        resToSend: null,
      };
    }

    // If the user has an annual subscription that has not expired yet
    const currentDate = moment().format("YYYY-MM-DD");

    if (
      userSubscriptionPlanName === SubscriptionType.ANNUAL &&
      userSubscriptionExpiry >= currentDate
    ) {
      return {
        status: true,
        resToSend: null,
      };
    }

    // If the user has an annual subscription that has expired
    if (
      userSubscriptionPlanName === SubscriptionType.ANNUAL &&
      userSubscriptionExpiry < currentDate
    ) {
      return {
        status: false,
        resToSend: {
          message: "Your annual subscription plan has expired.",
          status: false,
          data: null,
        },
      };
    }
  }
}
