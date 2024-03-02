import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  RejectionList,
  RejectionListSchema,
} from "../rejection-list/entities/rejection-list.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowSchema,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
import { UserAuthentication } from "../../auth/auth.service";
import { NestModule } from "@nestjs/common";
import { DocumentMiddleware } from "../../middleware/image.middleware";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
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
  PanApplication,
  PanAppSchema,
} from "../panapplications/entities/pan.entity";
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
import { adminHelper } from "../admin/admin.helper";
import { DscCart, DscCartSchema } from "./entities/dsc-cart.entity";
import { DscCartHelper } from "./dsc-cart.helper";
import { DscCartService } from "./dsc-cart.service";
import { DscCartController } from "./dsc-cart.controller";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
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
  Transaction,
  TransactionSchema,
} from "../transaction/entities/transaction.entity";
import {
  PanApplicationFlow,
  PanAppFlowSchema,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  AccessModule,
  AccessModuleSchema,
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
  PriceConfig,
  PriceConfigSchema,
} from "../price-config/entities/price-config.entity";
import { paytmFunctions } from "../../helper/payment-gateway";
import { TransactionService } from "../transaction/transaction.service";
import { TransactionHelper } from "../transaction/transaction.helper";
import { PanCart, PanCartSchema } from "../pan-cart/entities/pan-cart.entity";
import { ItrCart, ItrCartSchema } from "../itr-cart/entities/itr-cart.entity";
import {
  GumastaCart,
  GumastaCartSchema,
} from "../gumasta-cart/entities/gumasta-cart.entity";
import {
  MsmeCart,
  MsmeCartSchema,
} from "../msme-cart/entities/msme-cart.entity";
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import {
  DigitalPanApplication,
  DigitalPanSchema,
} from "../digital-pan/entities/digital-pan.entity";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import { EmailService } from "src/helper/sendEmail";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
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
    MongooseModule.forFeature([
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: DscCart.name, schema: DscCartSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: Commission.name, schema: CommissionSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: PanApplicationFlow.name, schema: PanAppFlowSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      {
        name: PriceConfig.name,
        schema: PriceConfigSchema,
      },
      { name: PanCart.name, schema: PanCartSchema },
      { name: ItrCart.name, schema: ItrCartSchema },
      { name: MsmeCart.name, schema: MsmeCartSchema },
      { name: GumastaCart.name, schema: GumastaCartSchema },
      { name: DigitalPanWallet.name, schema: DigitalPanWalletSchema },
      {
        name: DigitalPanTransactions.name,
        schema: DigitalPanTransactionsSchema,
      },
      {
        name: DigitalPanApplication.name,
        schema: DigitalPanSchema,
      },
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
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
      { name: CategoryDsaConfig.name, schema: CategoryDsaConfigSchema },
      { name: CategoryPcoConfig.name, schema: CategoryPcoConfigSchema },
    ]),
  ],
  controllers: [DscCartController],
  providers: [
    DscCartService,
    DscCartHelper,
    AddLogFunction,
    userAuthHelper,
    postApplication,
    adminHelper,
    getUniqueTransactionId,
    paytmFunctions,
    TransactionService,
    TransactionHelper,
    EmailService,
    checkSubscriptionPlan,
  ],
})
export class DscCartModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "dsc-cart/add",
        "dsc-cart/view",
        "dsc-cart/delete",
        "dsc-cart/checkout"
      );
  }
}
