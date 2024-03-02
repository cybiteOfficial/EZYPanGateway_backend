import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Otp, OtpSchema } from "../otp/entity/create-otp.entity";
import { NestModule, MiddlewareConsumer } from "@nestjs/common";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategorySchema,
} from "../itr-category/entities/itr-category.entity";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  PriceConfig,
  PriceConfigSchema,
} from "../price-config/entities/price-config.entity";
import {
  VerifyRefreshToken,
  UserAuthentication,
  otpTokenVerify,
} from "../../auth/auth.service";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
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
  GumastaApplication,
  GumastaApplicationSchema,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from "../msme-application/entities/msme-application.entity";
import {
  PanApplicationFlow,
  PanAppFlowSchema,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  ItrApplicationFlow,
  ItrApplicationFlowSchema,
} from "../itr-application-flow/entities/itr-application-flow.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowSchema,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowSchema,
} from "../msme-application-flow/entities/msme-application-flow.entity";
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowSchema,
} from "../gumasta-application-flow/entities/gumasta-application-flow.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { cancelApplication } from "../../helper/cancelApplication";
import { DocumentMiddleware } from "../../middleware/image.middleware";
import { reUploadPdf } from "../../helper/reuploadPdf";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import {
  DistributorRetailers,
  DistributorRetailersSchema,
} from "./entities/distributor-retailers.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DistributorRetailers.name, schema: DistributorRetailersSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: PanApplicationFlow.name, schema: PanAppFlowSchema },
      { name: ItrApplicationFlow.name, schema: ItrApplicationFlowSchema },
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      { name: MsmeApplicationFlow.name, schema: MsmeApplicationFlowSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
      { name: AccessModule.name, schema: AccessModuleSchema },
      {
        name: RefundWallet.name,
        schema: RefundWalletSchema,
      },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
    ]),
  ],
  controllers: [],
  providers: [
    ,
    AddLogFunction,
    userAuthHelper,
    refundWalletAmt,
    cancelApplication,
    reUploadPdf,
    EmailService,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes();
  }
}
