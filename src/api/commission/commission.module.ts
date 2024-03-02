import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CommissionService } from "./commission.service";
import { CommissionController } from "./commission.controller";
import { MongooseModule } from "@nestjs/mongoose";

import { Log, LogSchema } from "../log/entities/log.entity";
import { ImageMiddleware } from "../../middleware/image.middleware";
import { User, UserSchema } from "../user/entities/user.entity";
import { AddLogFunction } from "../../helper/addLog";
import { userAuthHelper } from "../../auth/auth.helper";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import { Commission, CommissionSchema } from "./entities/commission.entity";
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
  CommissionUpdateHistory,
  CommissionUpdateHistorySchema,
} from "../commission-update-history/entities/commission-update-history.entity";
import {
  AccessModule,
  AccessModuleSchema,
} from "../accessmodule/entities/access-module.entity";
import {
  CategoryDsaConfig,
  CategoryDsaConfigSchema,
} from "../category-dsa-config/entities/category-dsa-config.entity";
import {
  CategoryPcoConfig,
  CategoryPcoConfigSchema,
} from "../category-pco-config/entities/category-pco-config.entity";
import {
  UserCommission,
  UserCommissionSchema,
} from "../userCommission/entities/user-commission.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Commission.name, schema: CommissionSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Log.name, schema: LogSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      {
        name: CommissionUpdateHistory.name,
        schema: CommissionUpdateHistorySchema,
      },
      {
        name: CategoryDsaConfig.name,
        schema: CategoryDsaConfigSchema,
      },
      {
        name: CategoryPcoConfig.name,
        schema: CategoryPcoConfigSchema,
      },
    ]),
  ],
  controllers: [CommissionController],
  providers: [
    CommissionService,
    AddLogFunction,
    userAuthHelper,
    AllAccessFields,
  ],
})
export class CommissionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/commission/add",
        "/commission/update",
        "/commission/admin/view",
        "/commission/admin/get-all",
        "/commission/updated-history",
        "/commission/admin/get-categories",
        "/commission/update-categories",
        "/commission/history/add",
        "/commission/history/update",
        "/commission/history/view",
        "/commission/history/delete"
      );
  }
}
