import { Admin, AdminSchema } from "./entities/admin.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  UserAuthentication,
  VerifyRefreshToken,
  VerifyToken,
} from "../../auth/auth.service";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import { Otp, OtpSchema } from "../otp/entity/create-otp.entity";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import { reportAdmin } from "../../helper/reportCountForAdmin";
import {
  PanApplication,
  PanAppSchema,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationSchema,
} from "../itr-application/entities/itr-application.entity";
import {
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from "../msme-application/entities/msme-application.entity";
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from "../gumasta-application/entities/gumasta-application.entity";
import { reportDistributor } from "../../helper/reportCountForDistributor";
import { reportForRetailer } from "../../helper/reportCountForRetailer";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import { EmailService } from "src/helper/sendEmail";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      {
        name: AccessModule.name,
        schema: AccessModuleSchema,
      },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
    ]),
  ],

  controllers: [AdminController],
  providers: [
    AdminService,
    AddLogFunction,
    userAuthHelper,
    reportAdmin,
    reportDistributor,
    reportForRetailer,
    EmailService,
  ],
  exports: [AdminService],
})
export class AdminModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/admin/update",
        "/admin/add",
        "/admin/pagination",
        "/admin/change-password",
        "/admin/report-admin",
        "/admin/report-admin",
        "/admin/view",
        "/admin/get-all",
        "/admin/delete",
        "/admin/get-role-access-list",
        "/admin/change-password-admin"
      );
    consumer.apply(VerifyRefreshToken).forRoutes("/admin/refresh-token");
  }
}
