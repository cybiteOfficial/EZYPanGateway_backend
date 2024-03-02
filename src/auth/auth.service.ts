import { User, UserDocument } from "../api/user/entities/user.entity";
import { userAuthHelper } from "./auth.helper";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { HttpException } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";
import { errorRes } from "../helper/errorRes";
import { Admin, adminDocument } from "../api/admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleDocument,
} from "../api/adminrole/entities/adminrole.entity";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  AllAccessFields,
  AllAccessFieldsDocument,
} from "../api/all-access-fields/entites/all-access-module.entity";
import {
  AccessModule,
  AccessModuleDocument,
} from "../api/accessmodule/entities/access-module.entity";
import { notRequiredAccessRoutes } from "../helper/notRequiredAccessRoutes";

@Injectable()
export class VerifyToken implements NestMiddleware {
  async use(req: any, res: Response, next: () => void) {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
      return res.status(401).send({
        message: "Authentication Failed.",
        code: "USER_NOT_FOUND.",
        issue: "INVALID_TOKEN",
        status: false,
      });
    } else {
      try {
        const decoded = jwt.verify(token, process.env.SEC_KEY_ACC) as {
          [key: string]: any;
        };

        req["userData"] = decoded;
      } catch (err) {
        const errData = errorRes(err);
        return res.status(401).send({ ...errData.resData });
      }
    }
    return next();
  }
}

export class checkAccessRoutes implements NestMiddleware {
  [x: string]: any;
  constructor(
    @InjectModel(AccessModule.name)
    private accessModuleModel: Model<AccessModuleDocument>
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const query = {};
    const accessModule = await this.accessModuleModel.aggregate([
      { $match: query },
    ]);

    const reqUrl = req.baseUrl.toUpperCase();
    const reqMethod = req.method.toUpperCase();
    const matchedUrl = accessModule.find((module: any) => {
      return (
        module.method.toUpperCase() === reqMethod &&
        module.url.toUpperCase() === reqUrl
      );
    });

    const routeNotRequiredForAccessModule = notRequiredAccessRoutes();

    const notIncludedRoutes = !routeNotRequiredForAccessModule.includes(
      reqUrl.toLowerCase()
    );

    if (matchedUrl) {
      next();
      // } else if (notIncludedRoutes) {
      //   next();
    } else {
      return res.status(401).send({
        message: "Access module not added for this route.",
        code: "INVALID_ROUTE.",
        issue: "AUTHENTICATION_FAILED",
        data: null,
        status: false,
      });
    }
  }
}

export class otpTokenVerify implements NestMiddleware {
  [x: string]: any;
  constructor(
    private readonly userAuthHelper: userAuthHelper,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminRole.name)
    private AdminRoleModel: Model<AdminRoleDocument>,
    @InjectModel(AllAccessFields.name)
    private AllAccessFieldsModel: Model<AllAccessFieldsDocument>
  ) {}
  async use(req: Request, res: any, next: NextFunction) {
    try {
      const tokenExist = this.userAuthHelper.tokenExistCheck(req);
      if (tokenExist) {
        const decoded = await this.userAuthHelper.AccTokenDecode(req);
        if (decoded) {
          req["otpData"] = decoded;
          if (["MOBILE_OTP", "EMAIL_OTP"].includes(req["otpData"].token_type)) {
            next();
          } else {
            return res.status(401).send({
              message: "Invalid token.",
              code: "INVALID_TOKEN",
              issue: "INVALID_TOKEN",
              status: false,
              data: null,
            });
          }
        }
      } else {
        return res.status(401).send({
          message: "Please login yourself first.",
          code: "TOKEN_NOT_FOUND",
          issue: "AUTHENTICATION_FAILED",
          status: false,
          data: null,
        });
      }
    } catch (err) {
      const errData = errorRes(err);
      return res.status(401).send({ ...errData.resData });
    }
  }
}

export class VerifyRefreshToken implements NestMiddleware {
  [x: string]: any;
  constructor(
    private readonly userAuthHelper: userAuthHelper,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminRole.name)
    private AdminRoleModel: Model<AdminRoleDocument>,
    @InjectModel(AllAccessFields.name)
    private AllAccessFieldsModel: Model<AllAccessFieldsDocument>
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.token;
      if (!token) {
        return res.status(401).send({
          message: "Authentication Failed.",
          code: "TOKEN_NOT_FOUND.",
          issue: "INVALID_TOKEN",
          status: false,
        });
      }

      const deviceId = req.headers.deviceid;
      if (!deviceId) {
        return res.status(401).send({
          message: "Authentication Failed.",
          code: "DEVICE_ID_NOT_FOUND.",
          issue: "DEVICE_ID_REQUIRED",
          status: false,
        });
      }

      const decoded = await this.userAuthHelper.RefreshTokenDecode(req);

      if (!decoded) {
        return res.status(401).send({
          message: "Authentication Failed.",
          code: "INVALID_TOKEN.",
          issue: "INVALID_TOKEN",
          status: false,
        });
      }
      req["userData"] = decoded;

      if (["SUPER_ADMIN", "ADMIN"].includes(req["userData"].type)) {
        const adminExist = await this.userAuthHelper.AdminExistCheck(req);
        if (!adminExist) {
          return res.status(401).send({
            message: "Please register youself first",
            code: "USER_NOT_FOUND",
            issue: "AUTHENTICATION_FAILED",
            status: false,
            data: null,
          });
        }

        const isUserActive = await this.userAuthHelper.userActiveCheck(
          adminExist
        );
        if (!isUserActive.status) {
          return res.status(401).send({
            ...isUserActive.resToSend,
          });
        }
      }
      if (["DISTRIBUTOR", "RETAILER", "GUEST"].includes(req["userData"].type)) {
        const userExist = await this.userAuthHelper.UserExistCheck(req);
        if (!userExist) {
          return res.status(401).send({
            message: "Please register youself first",
            code: "USER_NOT_FOUND",
            issue: "AUTHENTICATION_FAILED",
            status: false,
            data: null,
          });
        }

        const isUserActive = await this.userAuthHelper.userActiveCheck(
          userExist
        );
        if (!isUserActive.status) {
          return res.status(401).send({
            ...isUserActive.resToSend,
          });
        }

        const isUserBlocked = await this.userAuthHelper.userBlockedCheck(
          userExist
        );
        if (!isUserBlocked.status) {
          return res.status(401).send({
            ...isUserBlocked.resToSend,
          });
        }

        const isUserVerifiedCheck = await this.userAuthHelper.userVerifiedCheck(
          userExist,
          req["userData"].type
        );
        if (!isUserVerifiedCheck.status) {
          return res.status(401).send({
            ...isUserVerifiedCheck.resToSend,
          });
        }
      }
      if (req["userData"].token_type !== "REFRESH") {
        return res.status(401).send({
          message: "Authentication Failed.",
          code: "REFRESH_TOKEN_INVALID.",
          issue: "INVALID_TOKEN",
          status: false,
        });
      }
      return next();
    } catch (err) {
      const errData = errorRes(err);
      return res.status(401).send({ ...errData.resData });
    }
  }
}

export class UserAuthentication implements NestMiddleware {
  [x: string]: any;
  constructor(
    private readonly userAuthHelper: userAuthHelper,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    @InjectModel(AccessModule.name)
    private accessmoduleModel: Model<AccessModuleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminRole.name)
    private AdminRoleModel: Model<AdminRoleDocument>,
    @InjectModel(AllAccessFields.name)
    private AllAccessFieldsModel: Model<AllAccessFieldsDocument>
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const permission = [];
      const tokenExist = this.userAuthHelper.tokenExistCheck(req);
      if (tokenExist) {
        const decoded = await this.userAuthHelper.AccTokenDecode(req);

        if (!decoded) {
          return res.status(401).send({
            message: "Invalid token found.",
            code: "INVALID_TOKEN.",
            issue: "AUTHENTICATION_FAILED",
            data: null,
            status: false,
          });
        }

        req["userData"] = decoded;

        const allRoles = await this.userAuthHelper.getAllRoles();

        if (
          !allRoles.includes(req["userData"].type) ||
          !req["userData"].Id ||
          !this.userAuthHelper.checkTokenType(req)
        ) {
          return res.status(401).send({
            message: "Invalid user type.",
            code: "INVALID_TOKEN",
            issue: "AUTHENTICATION_FAILED",
            status: false,
            data: null,
          });
        }

        const reqUrl = req.baseUrl;

        const reqMethod = req.method.toUpperCase();
        /**
         * SUPER_ADMIN ALLOWED to access all modules
         */

        if (["SUPER_ADMIN", "ADMIN"].includes(req["userData"].type)) {
          const adminExist = await this.userAuthHelper.AdminExistCheck(req);
          if (!adminExist) {
            return res.status(401).send({
              message: "Please register youself first",
              code: "USER_NOT_FOUND",
              issue: "AUTHENTICATION_FAILED",
              status: false,
              data: null,
            });
          }

          const isUserActive = await this.userAuthHelper.userActiveCheck(
            adminExist
          );
          if (!isUserActive.status) {
            return res.status(401).send({
              ...isUserActive.resToSend,
            });
          }

          const isRedisTokenMatched =
            await this.userAuthHelper.checkAccessTokenInRedis(req);
          if (!isRedisTokenMatched.status) {
            return res.status(401).send({ ...isRedisTokenMatched.resToSend });
          }

          if (req["userData"].type === "SUPER_ADMIN") {
            req["projectQuery"] = null;
            next();
          }

          /**
           * 
           for user type ADMIN
           */
          if (req["userData"].type === "ADMIN") {
            //check if route is default route
            const defaultAccess = await this.accessmoduleModel.aggregate([
              {
                $match: {
                  isadminApi: true,
                  method: reqMethod,
                  skip: true,
                  url: reqUrl,
                },
              },
            ]);

            if (defaultAccess.length) {
              next();
            } else {
              const adminAccess = await this.userAuthHelper.AccessCheck(
                req["userData"],
                reqMethod,
                reqUrl
              );
              if (!adminAccess || !adminAccess.status) {
                return res.status(403).send({
                  message: "You do not have permission to access this.",
                  code: "PERMISSION_DENIED.",
                  issue: "AUTHORIZATION_FAILED",
                  status: false,
                  data: null,
                });
              }

              const projectionQuery = await this.userAuthHelper.projectQuery(
                adminAccess.fields
              );

              if (projectionQuery && Object.keys(projectionQuery).length) {
                req["projectQuery"] = projectionQuery;
              } else {
                req["projectQuery"] = null;
              }

              next();
            }
          }
        }
        if (
          ["DISTRIBUTOR", "RETAILER", "GUEST"].includes(req["userData"].type)
        ) {
          const userExist = await this.userAuthHelper.UserExistCheck(req);
          if (!userExist) {
            return res.status(401).send({
              message: "Please register youself first",
              code: "USER_NOT_FOUND",
              issue: "AUTHENTICATION_FAILED",
              status: false,
              data: null,
            });
          }

          if (req["userData"].type === "RETAILER") {
            const isProfileComplete =
              await this.userAuthHelper.retailerProfileCompleteCheck(
                userExist,
                reqUrl,
                reqMethod
              );
            if (!isProfileComplete.status) {
              return res.status(401).send({
                ...isProfileComplete.resToSend,
              });
            }
          }

          const isUserActive = await this.userAuthHelper.userActiveCheck(
            userExist
          );

          if (!isUserActive.status) {
            return res.status(401).send({
              ...isUserActive.resToSend,
            });
          }

          // const userRejectCheck = await this.userAuthHelper.userRejectCheck(
          //   userExist
          // );

          // if (!userRejectCheck.status) {
          //   return res.status(401).send({
          //     ...userRejectCheck.resToSend,
          //   });
          // }
          if (req["userData"].type === "DISTRIBUTOR") {
            const isUserVerifiedCheck =
              await this.userAuthHelper.userVerifiedCheck(
                userExist,
                req["userData"].type
              );

            if (!isUserVerifiedCheck.status) {
              return res.status(401).send({
                ...isUserVerifiedCheck.resToSend,
              });
            }
          }

          const isRedisTokenMatched =
            await this.userAuthHelper.checkAccessTokenInRedis(req);

          if (!isRedisTokenMatched.status) {
            return res.status(401).send({ ...isRedisTokenMatched.resToSend });
          }
          const isUserBlocked = await this.userAuthHelper.userBlockedCheck(
            userExist
          );

          if (!isUserBlocked.status) {
            return res.status(401).send({
              ...isUserBlocked.resToSend,
            });
          }

          next();
        }
      } else {
        return res.status(401).send({
          message: "Please login yourself first.",
          code: "TOKEN_NOT_FOUND",
          issue: "AUTHENTICATION_FAILED",
          status: false,
          data: null,
        });
      }
    } catch (error) {
      const errData = errorRes(error);
      return res.status(401).send({ ...errData.resData });
    }
  }
}
