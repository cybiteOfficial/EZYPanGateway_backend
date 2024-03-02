import { UserAuthentication } from "../../auth/auth.service";
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { userAuthHelper } from "../../auth/auth.helper";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  GumastaDistrictConfig,
  GumastaDistrictConfigSchema,
} from "./entities/gumasta-district-config.entity";
import { GumastaDistrictConfigController } from "./gumasta-district-config.controller";
import { GumastaDistrictConfigService } from "./gumasta-district-config.service";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GumastaDistrictConfig.name, schema: GumastaDistrictConfigSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [GumastaDistrictConfigController],
  providers: [GumastaDistrictConfigService, AddLogFunction, userAuthHelper],
})
export class GumastaDistrictConfigModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/gumasta-district-config/add",
        "/gumasta-district-config/update",
        "/gumasta-district-config/delete",
        "/gumasta-district-config/change-status",
        "/gumasta-district-config/list/pagination",
        "/gumasta-district-config/add",
        "/gumasta-district-config/update"
      );
  }
}
