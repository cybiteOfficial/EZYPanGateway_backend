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
import { LoanEnquiry, LoanEnquirySchema } from "./entities/loan-enquiry.entity";
import { LoanEnquiryController } from "./loan-enquiry.controller";
import { LoanEnquiryService } from "./loan-enquiry.service";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: LoanEnquiry.name, schema: LoanEnquirySchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [LoanEnquiryController],
  providers: [LoanEnquiryService, AddLogFunction, userAuthHelper],
})
export class LoanEnquiryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes("/loan-enquiry/list/pagination");
  }
}
