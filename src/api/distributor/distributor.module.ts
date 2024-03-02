import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { Otp, OtpSchema } from "../otp/entity/create-otp.entity";

import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import { MongooseModule } from "@nestjs/mongoose";
import { DistributorService } from "./distributor.service";
import { Module } from "@nestjs/common";
import { DistributorController } from "./distributor.controller";
import { MiddlewareConsumer } from "@nestjs/common";
import {
  VerifyToken,
  VerifyRefreshToken,
  otpTokenVerify,
  UserAuthentication,
} from "../../auth/auth.service";
import { AddLogFunction } from "../../helper/addLog";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategorySchema,
} from "../itr-category/entities/itr-category.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { checkProfile } from "../../helper/profileComplete";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import {
  SubscriptionFlow,
  SubscriptionFlowSchema,
} from "../subscription-flow/entities/subscription-flow.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  AccessModule,
  AccessModuleSchema,
} from "../accessmodule/entities/access-module.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../../api/email-templates/entities/email-template.module";
import { smsTemplateService } from "../../helper/smsTemplates";
import {
  SmsTemplate,
  SmsTemplateSchema,
} from "../sms-templates/entities/sms-templates.entity";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import { DocumentMiddleware } from "src/middleware/image.middleware";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import {
  PanAppSchema,
  PanApplication,
} from "../panapplications/entities/pan.entity";
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
import {
  ItrApplication,
  ItrApplicationSchema,
} from "../itr-application/entities/itr-application.entity";
import {
  DistributorRetailers,
  DistributorRetailersSchema,
} from "../distributor-retailers/entities/distributor-retailers.entity";
import { WhatsappMsgService } from "../../helper/sendWhatsApp";
import {
  WhatsappTemplate,
  WhatsappTemplateSchema,
} from "../whatsapp-template/entities/whatsapp-template.entity";
import {
  WhatsappLogs,
  WhatsappLogsSchema,
} from "../whatsapp-logs/entities/whatsapp-logs.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: SubscriptionFlow.name, schema: SubscriptionFlowSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: SmsTemplate.name, schema: SmsTemplateSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: DigitalPanWallet.name, schema: DigitalPanWalletSchema },
      {
        name: DigitalPanTransactions.name,
        schema: DigitalPanTransactionsSchema,
      },
      { name: EmailLogs.name, schema: EmailLogsSchema },
      { name: DistributorRetailers.name, schema: DistributorRetailersSchema },
      { name: WhatsappTemplate.name, schema: WhatsappTemplateSchema },
      { name: WhatsappLogs.name, schema: WhatsappLogsSchema },
    ]),
  ],
  controllers: [DistributorController],
  providers: [
    DistributorService,
    AddLogFunction,
    userAuthHelper,
    checkProfile,
    refundWalletAmt,
    EmailService,
    smsTemplateService,
    WalletAmt,
    WhatsappMsgService,
  ],
})
export class DistributorModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/distributor/list/pagination",
        "/distributor/admin/view",
        "/distributor/update-status",
        "/distributor/block-user",
        "/distributor/get-all",
        "/distributor/profile",
        "/distributor/change-password",
        "/distributor/admin/subscriptions",
        "/distributor/subscription-history",
        "/distributor/retailers/list",
        "/distributor/get-retailer-count"
      );
    consumer.apply(otpTokenVerify).forRoutes("/distributor/otp-verify");
    consumer.apply(VerifyRefreshToken).forRoutes("/distributor/refresh-token");
    consumer.apply(DocumentMiddleware).forRoutes("/distributor/update-status");
  }
}
