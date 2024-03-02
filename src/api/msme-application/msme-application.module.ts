import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { UserAuthentication, VerifyToken } from "../../auth/auth.service";
import { MsmeApplicationService } from "./msme-application.service";
import { MsmeApplicationController } from "./msme-application.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from "./entities/msme-application.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowSchema,
} from "../msme-application-flow/entities/msme-application-flow.entity";
import {
  RejectionList,
  RejectionListSchema,
} from "../rejection-list/entities/rejection-list.entity";
import {
  DocumentMiddleware,
  MultipleDocumentMiddleware,
} from "../../middleware/image.middleware";
import { userAuthHelper } from "../../auth/auth.helper";
import { AddLogFunction } from "../../helper/addLog";
import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  PanCategory,
  PanCategorySchema,
} from "../pan-category/entities/pan-category.entity";
import {
  ItrCategory,
  ItrCategorySchema,
} from "../itr-category/entities/itr-category.entity";
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
  DigitalSign,
  DigitalSignSchema,
} from "../digital-sign/entities/digital-sign.entity";
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
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { MsmeHelper } from "./msme-application.helper";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  PriceConfig,
  PriceConfigSchema,
} from "../price-config/entities/price-config.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import {
  Transaction,
  TransactionSchema,
} from "../transaction/entities/transaction.entity";
import { paytmFunctions } from "../../helper/payment-gateway";
import { TransactionService } from "../transaction/transaction.service";
import { TransactionHelper } from "../transaction/transaction.helper";
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
  GumastaApplicationFlow,
  GumastaApplicationFlowSchema,
} from "../gumasta-application-flow/entities/gumasta-application-flow.entity";
import {
  PanAppFlowSchema,
  PanApplicationFlow,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  ItrApplicationFlow,
  ItrApplicationFlowSchema,
} from "../itr-application-flow/entities/itr-application-flow.entity";
import {
  CategoryPcoConfig,
  CategoryPcoConfigSchema,
} from "../category-pco-config/entities/category-pco-config.entity";
import {
  CategoryDsaConfig,
  CategoryDsaConfigSchema,
} from "../category-dsa-config/entities/category-dsa-config.entity";
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
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: MsmeApplicationFlow.name, schema: MsmeApplicationFlowSchema },
      { name: Log.name, schema: LogSchema },
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: Commission.name, schema: CommissionSchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
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
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
      {
        name: PanApplicationFlow.name,
        schema: PanAppFlowSchema,
      },
      {
        name: ItrApplicationFlow.name,
        schema: ItrApplicationFlowSchema,
      },
      {
        name: DigitalPanApplication.name,
        schema: DigitalPanSchema,
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
  controllers: [MsmeApplicationController],
  providers: [
    MsmeApplicationService,
    AddLogFunction,
    userAuthHelper,
    postApplication,
    adminHelper,
    MsmeHelper,
    getUniqueTransactionId,
    paytmFunctions,
    TransactionService,
    TransactionHelper,
    EmailService,
    checkSubscriptionPlan,
    smsTemplateService,
    WhatsappMsgService,
  ],
})
export class MsmeApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      "/msme-application/update-status",
      "/msme-application/get-all",
      "/msme-application/admin/view",
      "/msme-application/list/pagination",
      "/msme-application/update",
      "/msme-application/get-allstatuscounts",
      "/msme-application/add",
      "/msme-application/assign-to",
      "/msme-application/aadhar-check",
      "/msme-application/list/history",
      // '/msme-application/view-with-srn',
      "/msme-application/view",
      "/msme-application/zip",
      "/msme-application/get-pending-applications",
      "/msme-application/get-inprogress-applications",
      "/msme-application/get-verified-applications",
      "/msme-application/get-rejected-applications",
      "/msme-application/get-generate-applications",
      "/msme-application/get-done-applications",
      "/msme-application/get-cancelled-applications",
      "/msme-application/admin/list/payment-pending",
      "/msme-application/retry-payment",
      "/msme-application/payment-history",
      "/msme-application/get-status-history"
    );
    consumer
      .apply(DocumentMiddleware)
      .forRoutes("/msme-application/update-status");
  }
}
