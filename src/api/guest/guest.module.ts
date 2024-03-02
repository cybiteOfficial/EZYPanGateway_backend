import {
  otpTokenVerify,
  UserAuthentication,
  VerifyRefreshToken,
} from "../../auth/auth.service";
import { Otp, OtpSchema } from "../otp/entity/create-otp.entity";
import { Log, LogSchema } from "../log/entities/log.entity";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import { GuestController } from "./guest.controller";
import { GuestService } from "./guest.service";
import { User, UserSchema } from "../user/entities/user.entity";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from "@nestjs/common";

import { AddLogFunction } from "../../helper/addLog";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import { refundWalletAmt } from "../refund-wallet/refund-wallet.helper";
import {
  ItrCategory,
  ItrCategorySchema,
} from "../itr-category/entities/itr-category.entity";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { userAuthHelper } from "../../auth/auth.helper";
import { checkProfile } from "../../helper/profileComplete";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import {
  PanApplication,
  PanAppSchema,
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: Log.name, schema: LogSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      {
        name: EmailTemplate.name,
        schema: EmailTemplateSchema,
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
    ]),
  ],
  controllers: [GuestController],
  providers: [
    GuestService,
    AddLogFunction,
    checkProfile,
    userAuthHelper,
    refundWalletAmt,
    EmailService,
    WalletAmt,
  ],
})
export class GuestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/guest/list/pagination",
        "/guest/admin/view",
        "/guest/get-all",
        "/guest/guest-profile",
        "/guest/block-user",
        "/guest/apply-for-distributor"
      );
    consumer.apply(otpTokenVerify).forRoutes("/guest/token-verify");
    consumer.apply(VerifyRefreshToken).forRoutes("/guest/refresh-token");
  }
}
