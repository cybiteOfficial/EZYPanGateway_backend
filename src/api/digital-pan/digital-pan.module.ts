import {
  PanApplicationFlow,
  PanAppFlowSchema,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import { DigitalPanController } from "./digital-pan.controller";
import { DigitalPanServices } from "./digital-pan.service";
import {
  DigitalPanApplication,
  DigitalPanSchema,
} from "./entities/digital-pan.entity";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  RejectionList,
  RejectionListSchema,
} from "../rejection-list/entities/rejection-list.entity";
import { DocumentMiddleware } from "../../middleware/image.middleware";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { DigitalPanHelper } from "./digital-pan.helper";
import { UserAuthentication } from "../../auth/auth.service";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { TransactionService } from "../transaction/transaction.service";
import {
  Transaction,
  TransactionSchema,
} from "../transaction/entities/transaction.entity";
import { adminHelper } from "../admin/admin.helper";
import { postApplication } from "../../helper/postApplication";
import {
  RewardHistory,
  RewardHistorySchema,
} from "../rewardHistory/entities/rewardHistory.entity";
import {
  RewardValueConfig,
  RewardValueConfigSchema,
} from "../rewardValueConfig/entities/rewardValueConfig.entity";
import {
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
import {
  ItrApplication,
  ItrApplicationSchema,
} from "../itr-application/entities/itr-application.entity";
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from "../msme-application/entities/msme-application.entity";
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from "../gumasta-application/entities/gumasta-application.entity";

import {
  userAndServiceWiseRewardConfig,
  userAndServiceWiseRewardConfigSchema,
} from "../userAndServiceWiseRewardConfig/entities/userAndServiceWiseRewardConfig.entity";
import {
  Commission,
  CommissionSchema,
} from "../commission/entities/commission.entity";
import {
  UserCommission,
  UserCommissionSchema,
} from "../userCommission/entities/user-commission.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  PriceConfig,
  PriceConfigSchema,
} from "../price-config/entities/price-config.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { TransactionHelper } from "../transaction/transaction.helper";
import {
  AccessModule,
  AccessModuleSchema,
} from "../accessmodule/entities/access-module.entity";
import { paytmFunctions } from "../../helper/payment-gateway";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import {
  MsmeCart,
  MsmeCartSchema,
} from "../msme-cart/entities/msme-cart.entity";
import { ItrCart, ItrCartSchema } from "../itr-cart/entities/itr-cart.entity";
import { DscCart, DscCartSchema } from "../dsc-cart/entities/dsc-cart.entity";
import {
  GumastaCart,
  GumastaCartSchema,
} from "../gumasta-cart/entities/gumasta-cart.entity";
import { PanCart, PanCartSchema } from "../pan-cart/entities/pan-cart.entity";
import {
  PanAppSchema,
  PanApplication,
} from "../panapplications/entities/pan.entity";
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import { WalletAmt } from "../digital-pan-wallet/digital-pan-wallet.helper";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import { EmailService } from "../../helper/sendEmail";
import {
  DigitalSignFlow,
  DigitalSignFlowSchema,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowSchema,
} from "../gumasta-application-flow/entities/gumasta-application-flow.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowSchema,
} from "../msme-application-flow/entities/msme-application-flow.entity";
import {
  ItrApplicationFlow,
  ItrApplicationFlowSchema,
} from "../itr-application-flow/entities/itr-application-flow.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { DigitalPanCron } from "./digitalpan.cronjob";
import {
  CategoryDsaConfig,
  CategoryDsaConfigSchema,
} from "../category-dsa-config/entities/category-dsa-config.entity";
import {
  CategoryPcoConfig,
  CategoryPcoConfigSchema,
} from "../category-pco-config/entities/category-pco-config.entity";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: DigitalPanApplication.name, schema: DigitalPanSchema },
      { name: PanApplicationFlow.name, schema: PanAppFlowSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: Commission.name, schema: CommissionSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      { name: MsmeCart.name, schema: MsmeCartSchema },
      { name: DscCart.name, schema: DscCartSchema },
      { name: ItrCart.name, schema: ItrCartSchema },
      { name: GumastaCart.name, schema: GumastaCartSchema },
      { name: PanCart.name, schema: PanCartSchema },
      { name: DigitalPanWallet.name, schema: DigitalPanWalletSchema },
      {
        name: DigitalPanTransactions.name,
        schema: DigitalPanTransactionsSchema,
      },
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
      {
        name: MsmeApplicationFlow.name,
        schema: MsmeApplicationFlowSchema,
      },

      {
        name: ItrApplicationFlow.name,
        schema: ItrApplicationFlowSchema,
      },
      {
        name: EmailLogs.name,
        schema: EmailLogsSchema,
      },
      {
        name: EmailTemplate.name,
        schema: EmailTemplateSchema,
      },
      { name: CategoryDsaConfig.name, schema: CategoryDsaConfigSchema },
      { name: CategoryPcoConfig.name, schema: CategoryPcoConfigSchema },
    ]),
  ],
  controllers: [DigitalPanController],
  providers: [
    DigitalPanServices,
    AddLogFunction,
    DigitalPanServices,
    userAuthHelper,
    TransactionService,
    adminHelper,
    postApplication,
    getUniqueTransactionId,
    TransactionHelper,
    paytmFunctions,
    DigitalPanHelper,
    WalletAmt,
    checkSubscriptionPlan,
    EmailService,
    DigitalPanCron,
  ],
})
export class DigitalPanModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/digital-pan/religare-auth",
        "/digital-pan/pancard-status",
        "/digital-pan/history",
        "/digital-pan/admin/list"
      );
    consumer.apply(DocumentMiddleware).forRoutes("/digital-pan/update-status");
  }
}
