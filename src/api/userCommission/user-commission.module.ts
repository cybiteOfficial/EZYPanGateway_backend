import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { MongooseModule } from "@nestjs/mongoose";

import { Log, LogSchema } from "../log/entities/log.entity";
import { ImageMiddleware } from "../../middleware/image.middleware";
import { User, UserSchema } from "../user/entities/user.entity";
import { AddLogFunction } from "../../helper/addLog";
import { userAuthHelper } from "../../auth/auth.helper";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import { UserAuthentication } from "../../auth/auth.service";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import {
  PanAppSchema,
  PanApplication,
} from "../panapplications/entities/pan.entity";
import { PanAppServices } from "../panapplications/pan.service";
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from "../msme-application/entities/msme-application.entity";
import {
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
import {
  ItrApplication,
  ItrApplicationSchema,
} from "../itr-application/entities/itr-application.entity";
import {
  UserCommission,
  UserCommissionSchema,
} from "./entities/user-commission.entity";
import { UserCommissionController } from "./user-commission.controller";
import { UserCommissionService } from "./user-commission.service";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: Log.name, schema: LogSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
    ]),
  ],
  controllers: [UserCommissionController],
  providers: [
    UserCommissionService,
    AddLogFunction,
    userAuthHelper,
    AllAccessFields,
  ],
})
export class UserCommissionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/user-commission/admin/list/pagination",
        "/user-commission/history",
        "/user-commission/admin/total-commission",
        "user-commission/get-all",
        "user-commission/total",
        "user-commission/filter",
        "user-commission/admin/total"
      );
  }
}
