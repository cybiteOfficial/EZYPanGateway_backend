import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { Transaction, TransactionSchema } from "./entities/transaction.entity";
import { MongooseModule } from "@nestjs/mongoose";
import { Log, LogSchema } from "../log/entities/log.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";

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
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { UserAuthentication } from "../../auth/auth.service";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  UserFlow,
  UserFlowSchema,
} from "../user-flow/entities/user-flow.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { TransactionController } from "./transaction.controller";
import { AddLogFunction } from "../../helper/addLog";
import { TransactionHelper } from "./transaction.helper";
import { paytmFunctions } from "../../helper/payment-gateway";
import {
  AccessModule,
  AccessModuleSchema,
} from "../accessmodule/entities/access-module.entity";
import { PanCart, PanCartSchema } from "../pan-cart/entities/pan-cart.entity";
import {
  GumastaCart,
  GumastaCartSchema,
} from "../gumasta-cart/entities/gumasta-cart.entity";
import {
  MsmeCart,
  MsmeCartSchema,
} from "../msme-cart/entities/msme-cart.entity";
import { ItrCart, ItrCartSchema } from "../itr-cart/entities/itr-cart.entity";
import { DscCart, DscCartSchema } from "../dsc-cart/entities/dsc-cart.entity";
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
import {
  RewardHistory,
  RewardHistorySchema,
} from "../rewardHistory/entities/rewardHistory.entity";
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
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import { EmailService } from "src/helper/sendEmail";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "../email-templates/entities/email-template.module";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import { TransactionCronService } from "./transaction.cronjob";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
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
      { name: AccessModule.name, schema: AccessModuleSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
      { name: PanCart.name, schema: PanCartSchema },
      { name: DscCart.name, schema: DscCartSchema },
      { name: MsmeCart.name, schema: MsmeCartSchema },
      { name: ItrCart.name, schema: ItrCartSchema },
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
        name: EmailLogs.name,
        schema: EmailLogsSchema,
      },
      {
        name: EmailTemplate.name,
        schema: EmailTemplateSchema,
      },
    ]),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionCronService,
    TransactionService,
    TransactionModule,
    userAuthHelper,
    AddLogFunction,
    TransactionHelper,
    paytmFunctions,
    getUniqueTransactionId,
    checkSubscriptionPlan,
    EmailService,
  ],
})
//  implements NestModule
export class TransactionModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      // '/transaction/verify-payment',
      "/transaction/view",
      "/transaction/list/pagination",
      "/transaction/get-application-type",
      "/transaction/update-status"
    );
  }
}
