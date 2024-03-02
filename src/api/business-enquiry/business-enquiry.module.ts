import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { userAuthHelper } from "../../auth/auth.helper";
import { UserAuthentication } from "../../auth/auth.service";
import { AddLogFunction } from "../../helper/addLog";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { BusinessEnquiryController } from "./business-enquiry.controller";
import { BusinessEnquiryService } from "./business-enquiry.service";
import {
  BusinessEnquiry,
  BusinessEnquirySchema,
} from "./entities/business-enquiry.entity";
import {
  AccessModule,
  AccessModuleSchema,
} from "../accessmodule/entities/access-module.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: BusinessEnquiry.name, schema: BusinessEnquirySchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [BusinessEnquiryController],
  providers: [BusinessEnquiryService, AddLogFunction, userAuthHelper],
})
export class BusinessEnquiryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes("/business-enquiry/list/pagination");
  }
}
