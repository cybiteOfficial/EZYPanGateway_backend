import { MiddlewareConsumer, Module } from "@nestjs/common";
import { digitalSignService } from "./digital-sign.service";
import { digitalSignController } from "./digital-sign.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { DigitalSign, DigitalSignSchema } from "./entities/digital-sign.entity";
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
import {
  DocumentMiddleware,
  MultipleDocumentMiddleware,
} from "../../middleware/image.middleware";
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
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  Transaction,
  TransactionSchema,
} from "../transaction/entities/transaction.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { DigitalSignHelper } from "./digital-sign.helper";
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
import { TransactionHelper } from "../transaction/transaction.helper";
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
import {
  SmsTemplate,
  SmsTemplateSchema,
} from "../sms-templates/entities/sms-templates.entity";
import { smsTemplateService } from "../../helper/smsTemplates";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import {
  ZipFile,
  ZipFileSchema,
} from "../create-zip/entities/create-zip.entity";
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
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      { name: Log.name, schema: LogSchema },
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
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
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
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
      { name: SmsTemplate.name, schema: SmsTemplateSchema },
      { name: ZipFile.name, schema: ZipFileSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
      { name: CategoryDsaConfig.name, schema: CategoryDsaConfigSchema },
      { name: CategoryPcoConfig.name, schema: CategoryPcoConfigSchema },
      { name: WhatsappTemplate.name, schema: WhatsappTemplateSchema },
      { name: WhatsappLogs.name, schema: WhatsappLogsSchema },
    ]),
  ],
  controllers: [digitalSignController],
  providers: [
    digitalSignService,
    AddLogFunction,
    userAuthHelper,
    postApplication,
    adminHelper,
    getUniqueTransactionId,
    DigitalSignHelper,
    TransactionService,
    TransactionHelper,
    paytmFunctions,
    EmailService,
    smsTemplateService,
    checkSubscriptionPlan,
    WhatsappMsgService,
  ],
})
export class digitalSignModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      "/dsc-application/update-status",
      "/dsc-application/get-all",
      "/dsc-application/admin/view",
      "/dsc-application/list/pagination",
      "/dsc-application/update",
      "/dsc-application/get-allstatuscounts",
      "/dsc-application/add",
      "/dsc-application/assign-to",
      "/dsc-application/assign-to",
      "/dsc-application/aadhar-check",
      "/dsc-application/list/history",
      // '/dsc-application/view-with-srn',
      "/dsc-application/view",
      "/dsc-application/zip",
      "/dsc-application/get-pending-applications",
      "/dsc-application/get-inprogress-applications",
      "/dsc-application/get-verified-applications",
      "/dsc-application/get-rejected-applications",
      "/dsc-application/get-generate-applications",
      "/dsc-application/get-done-applications",
      "/dsc-application/get-cancelled-applications",
      "/dsc-application/admin/list/payment-pending",
      "/dsc-application/retry-payment",
      "/dsc-application/payment-history",
      "/dsc-application/get-status-history"
    );
    consumer
      .apply(DocumentMiddleware)
      .forRoutes("/dsc-application/update-status");
  }
}
