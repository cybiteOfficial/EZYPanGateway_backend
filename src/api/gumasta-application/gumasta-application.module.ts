import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { GumastaApplicationService } from "./gumasta-application.service";
import { GumastaApplicationController } from "./gumasta-application.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from "./entities/gumasta-application.entity";
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowSchema,
} from "../gumasta-application-flow/entities/gumasta-application-flow.entity";
import { VerifyToken } from "../../auth/auth.service";
import {
  RejectionList,
  RejectionListSchema,
} from "../rejection-list/entities/rejection-list.entity";
import {
  DocumentMiddleware,
  MultipleDocumentMiddleware,
} from "../../middleware/image.middleware";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { UserAuthentication } from "../../auth/auth.service";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
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
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
import { adminHelper } from "../admin/admin.helper";
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
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { GumastaHelper } from "./gumasta-application.helper";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  PriceConfig,
  PriceConfigSchema,
} from "../price-config/entities/price-config.entity";
import { TransactionService } from "../transaction/transaction.service";
import {
  Transaction,
  TransactionSchema,
} from "../transaction/entities/transaction.entity";
import { TransactionHelper } from "../transaction/transaction.helper";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { RefundWalletTransactionModule } from "../refund-wallet-transaction/refund-wallet-transaction.module";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { paytmFunctions } from "../../helper/payment-gateway";
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
import { EmailService } from "../../helper/sendEmail";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import {
  ZipFile,
  ZipFileSchema,
} from "../create-zip/entities/create-zip.entity";
import {
  SmsTemplate,
  SmsTemplateSchema,
} from "../sms-templates/entities/sms-templates.entity";
import { smsTemplateService } from "../../helper/smsTemplates";
import {
  EmailLogs,
  EmailLogsSchema,
} from "../email-logs/entities/email-logs.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowSchema,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowSchema,
} from "../msme-application-flow/entities/msme-application-flow.entity";
import {
  PanAppFlowSchema,
  PanApplicationFlow,
} from "../pan-application-flow/entities/pan-application-flow.entity";
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
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
      { name: Log.name, schema: LogSchema },
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
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
      {
        name: DigitalPanApplication.name,
        schema: DigitalPanSchema,
      },
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      {
        name: MsmeApplicationFlow.name,
        schema: MsmeApplicationFlowSchema,
      },
      {
        name: PanApplicationFlow.name,
        schema: PanAppFlowSchema,
      },
      {
        name: ItrApplicationFlow.name,
        schema: ItrApplicationFlowSchema,
      },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: WhatsappTemplate.name, schema: WhatsappTemplateSchema },
      { name: WhatsappLogs.name, schema: WhatsappLogsSchema },
      { name: SmsTemplate.name, schema: SmsTemplateSchema },
      { name: ZipFile.name, schema: ZipFileSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
      { name: CategoryDsaConfig.name, schema: CategoryDsaConfigSchema },
      { name: CategoryPcoConfig.name, schema: CategoryPcoConfigSchema },
    ]),
  ],
  controllers: [GumastaApplicationController],
  providers: [
    GumastaApplicationService,
    AddLogFunction,
    userAuthHelper,
    postApplication,
    adminHelper,
    GumastaHelper,
    TransactionService,
    TransactionHelper,
    getUniqueTransactionId,
    paytmFunctions,
    EmailService,
    checkSubscriptionPlan,
    smsTemplateService,
    WhatsappMsgService,
  ],
})
export class GumastaApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      "/gumasta-application/admin/view",
      "/gumasta-application/get-all",
      "/gumasta-application/update-status",
      "/gumasta-application/list/pagination",
      "/gumasta-application/update",
      "/gumasta-application/get-allstatuscounts",
      "/gumasta-application/add",
      "/gumasta-application/aadhar-check",
      "/gumasta-application/assign-to",
      "/gumasta-application/list/history",
      // '/gumasta-application/view-with-srn',
      "/gumasta-application/view",
      "/gumasta-application/zip",
      "/gumasta-application/get-pending-applications",
      "/gumasta-application/get-inprogress-applications",
      "/gumasta-application/get-verified-applications",
      "/gumasta-application/get-rejected-applications",
      "/gumasta-application/get-generate-applications",
      "/gumasta-application/get-done-applications",
      "/gumasta-application/get-cancelled-applications",
      "/gumasta-application/admin/list/payment-pending",
      "/gumasta-application/retry-payment",
      "/gumasta-application/payment-history",
      "/gumasta-application/get-status-history"
    );

    consumer
      .apply(DocumentMiddleware)
      .forRoutes("/gumasta-application/update-status");
  }
}
