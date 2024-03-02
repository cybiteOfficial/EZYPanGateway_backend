import {
  GumastaStateConfig,
  GumastaStateConfigDocument,
  GumastaStateConfigSchema,
} from "./entities/gumasta-state-config.entity";
import { GumastaStateConfigController } from "./gumasta-state-config.controller";
import { GumastaStateConfigService } from "./gumasta-state-config.service";
import { ImageMiddleware } from "../../middleware/image.middleware";
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
} from "../gumasta-district-config/entities/gumasta-district-config.entity";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GumastaStateConfig.name, schema: GumastaStateConfigSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: GumastaDistrictConfig.name, schema: GumastaDistrictConfigSchema },
    ]),
  ],
  controllers: [GumastaStateConfigController],
  providers: [GumastaStateConfigService, AddLogFunction, userAuthHelper],
})
export class GumastaStateConfigModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/gumasta-state-config/add",
        "/gumasta-state-config/update",
        "/gumasta-state-config/delete",
        "/gumasta-state-config/change-status",
        "/gumasta-state-config/list/pagination",
        "/gumasta-state-config/add",
        "/gumasta-state-config/update"
      );
  }
}
