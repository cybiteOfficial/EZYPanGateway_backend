import { RetailerService } from "./retailer.service";
import { RetailerController } from "./retailer.controller";
import { User, UserSchema } from "../user/entities/user.entity";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import {
  otpTokenVerify,
  UserAuthentication,
  VerifyRefreshToken,
} from "../../auth/auth.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { checkProfile } from "../../helper/profileComplete";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import { Otp, OtpSchema } from "../otp/entity/create-otp.entity";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategorySchema,
} from "../itr-category/entities/itr-category.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { checkRetailersWithDistributorCode } from "../../helper/checkRetailerCount";
import {
  RetailerRegisterReward,
  RetailerRegisterRewardSchema,
} from "../retailer-register-reward/entities/retailer-register-reward.entity";
import {
  RewardHistory,
  RewardHistorySchema,
} from "../rewardHistory/entities/rewardHistory.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { smsTemplateService } from "../../helper/smsTemplates";
import {
  SmsTemplate,
  SmsTemplateSchema,
} from "../sms-templates/entities/sms-templates.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
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
UserRewardWallet;

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      {
        name: RetailerRegisterReward.name,
        schema: RetailerRegisterRewardSchema,
      },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      {
        name: EmailTemplate.name,
        schema: EmailTemplateSchema,
      },
      {
        name: SmsTemplate.name,
        schema: SmsTemplateSchema,
      },
      {
        name: DigitalPanWallet.name,
        schema: DigitalPanWalletSchema,
      },
      {
        name: DigitalPanTransactions.name,
        schema: DigitalPanTransactionsSchema,
      },
      { name: EmailLogs.name, schema: EmailLogsSchema },
      { name: DistributorRetailers.name, schema: DistributorRetailersSchema },
    ]),
  ],
  controllers: [RetailerController],
  providers: [
    RetailerService,
    AddLogFunction,
    checkProfile,
    userAuthHelper,
    checkRetailersWithDistributorCode,
    refundWalletAmt,
    smsTemplateService,
    EmailService,
    WalletAmt,
  ],
})
export class RetailerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/retailer/list/pagination",
        "retailer/admin/view",
        "retailer/get-all",
        "/retailer/retailer-profile",
        "/retailer/block-user",
        "/retailer/update-profile",
        "/retailer/apply-for-distributor"
      );
    consumer.apply(otpTokenVerify).forRoutes("/retailer/otp-verify");
    consumer.apply(VerifyRefreshToken).forRoutes("/retailer/refresh-token");
  }
}
