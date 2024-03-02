import { FileUploadModule } from "./api/file-upload/file-upload.module";
import { VideoTutorialModule } from "./api/video-tutorial/video-tutorial.module";
import { GuestModule } from "./api/guest/guest.module";
import { PriceConfigModule } from "./api/price-config/price-config.module";
import { PanCategoryModule } from "./api/pan-category/pan-category.module";
import { PanAppFlowModule } from "./api/pan-application-flow/pan-application-flow.module";
import { PanModule } from "./api/panapplications/pan.module";
import { AdminRoleModule } from "./api/adminrole/adminrole.module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./api/user/user.module";
import { UserFlowModule } from "./api/user-flow/user-flow.module";
import { AdminModule } from "./api/admin/admin.module";
import { ItrApplicationModule } from "./api/itr-application/itr-application.module";
import { ItrApplicationFlowModule } from "./api/itr-application-flow/itr-application-flow.module";
import { ItrCategoryModule } from "./api/itr-category/itr-category.module";
import { GumastaApplicationModule } from "./api/gumasta-application/gumasta-application.module";
import { GumastaApplicationFlowModule } from "./api/gumasta-application-flow/gumasta-application-flow.module";
import { digitalSignModule } from "./api/digital-sign/digital-sign.module";
import { DigitalSignFlowModule } from "./api/digital-sign-flow/digital-sign-flow.module";
import { MsmeApplicationModule } from "./api/msme-application/msme-application.module";
import { MsmeApplicationFlowModule } from "./api/msme-application-flow/msme-application-flow.module";
import { GalleryModule } from "./api/gallery/gallery.module";
import { GalleryCategoryModule } from "./api/gallery-category/gallery-category.module";
import { BannerModule } from "./api/banner/banner.module";
import { PopupBannerModule } from "./api/popup-banner/popup-banner.module";
import { VideoModule } from "./api/video/video.module";
import { MenuLinksModule } from "./api/menu-links/menu-links.module";
import { FooterModule } from "./api/footer/footer.module";
import { FooterCategoryModule } from "./api/footer-category/footer-category.module";
import { ContactInfoModule } from "./api/contact-info/contact-info.module";
import { RetailerModule } from "./api/retailer/retailer.module";
import { LogModule } from "./api/log/log.module";
import { DistributorModule } from "./api/distributor/distributor.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";
import { PendingAppModule } from "./api/pending-app/pending-app.module";
import { RejectionListModule } from "./api/rejection-list/rejection-list.module";
import { CityCodeModule } from "./api/city-code/city-code.module";
import { FaqModule } from "./api/faq/faq.module";
import { StateModule } from "./api/state/state.module";
import { AccessModule } from "./api/accessmodule/access-module.module";
import { AllAccessFieldsModule } from "./api/all-access-fields/all-access-fields.module";
import { SubscriptionFlowModule } from "./api/subscription-flow/subscription-flow.module";
import { InitialNameModule } from "./api/initial-name/initial-name.module";
import { TermsAndConditionsModule } from "./api/term-and-conditions/terms-and-conditions.module";
import { DashboardModule } from "./api/dashboard/dashboard.module";
import { BusinessEnquiryModule } from "./api/business-enquiry/business-enquiry.module";
import { LoanEnquiryModule } from "./api/loan-enquiry/loan-enquiry.module";
import { ContactUsEnquiryModule } from "./api/contact-us-enquiry/contact-us-enquiry.module";
import { RefundWalletModule } from "./api/refund-wallet/refund-wallet.module";
import { RefundWalletTransactionModule } from "./api/refund-wallet-transaction/refund-wallet-transaction.module";
import { RefundRequestModule } from "./api/refund-request/refund-request.module";
import { RewardPointModule } from "./api/rewardValueConfig/rewardValueConfig.module";
import { UserRewardModule } from "./api/rewardHistory/rewardHistory.module";
import { VersionModule } from "./api/version/version.module";
import { RefundAndCancellationPolicyModule } from "./api/refund-and-cancellation-policy/refund-and-cancellation-policy.module";
import { PrivacyPolicyModule } from "./api/privacy-policy/privacy-policy.module";
import { BusinessOpportunityModule } from "./api/business-opportunity/business-opportunity.module";
import { DownloadFileModule } from "./api/download-file/download-file.module";
import { StaticPageModule } from "./api/static-page/static-page.module";
import { OtherServiceModule } from "./api/other-service/other-service.module";
import { SendEmailModule } from "./api/send-email/send-email.module";
import { PanCartModule } from "./api/pan-cart/pan-cart-module";
import { ItrCartModule } from "./api/itr-cart/itr-cart.module";
import { MsmeCartModule } from "./api/msme-cart/msme-cart.module";
import { GumastaCartModule } from "./api/gumasta-cart/gumasta-cart.module";
import { DscCartModule } from "./api/dsc-cart/dsc-cart.module";
import { SubscriptionModule } from "./api/subscription-plan/subscription-plan.module";
import { TransactionModule } from "./api/transaction/transaction.module";
import { AccessModuleSchema } from "./api/accessmodule/entities/access-module.entity";
import { CommissionModule } from "./api/commission/commission.module";
import { RewardModule } from "./api/userAndServiceWiseRewardConfig/userAndServiceWiseRewardConfig.module";
import { RetailerRegisterRewardModule } from "./api/retailer-register-reward/retailer-register-reward.module";
import { UserCommissionModule } from "./api/userCommission/user-commission.module";
import { CommissionUpdateHistoryModule } from "./api/commission-update-history/commission-update-history.module";
import { EmailTemplatesModule } from "./api/email-templates/email-templates.module";
import { SmsTemplateModule } from "./api/sms-templates/sms-templates.module";
import { DigitalPanModule } from "./api/digital-pan/digital-pan.module";
import { DigitalPanWalletModule } from "./api/digital-pan-wallet/digital-pan-wallet.module";
import { ZipFileModule } from "./api/create-zip/create-zip.module";
import { EmailLogsModule } from "./api/email-logs/email-logs.module";
import { ScheduleModule } from "@nestjs/schedule";
import { monthlyExcelSheetModule } from "./api/monthly-excel-sheet/monthly-excel-sheet.module";
import { GumastaStateConfigModule } from "./api/gumasta-state-config/gumasta-state-config.module";
import { GumastaDistrictConfigModule } from "./api/gumasta-district-config/gumasta-district-config.module";
import { ErrorLoggingMiddleware } from "./middleware/log.middleware";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      {
        name: AccessModule.name,
        schema: AccessModuleSchema,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "..", "public"),
      serveRoot: "/public",
    }),

    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "..", ".well-known"),
      serveRoot: "/.well-known",
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".local.env"],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    ItrCartModule,
    UserModule,
    UserFlowModule,
    AdminModule,
    AdminRoleModule,
    PanModule,
    PanAppFlowModule,
    ItrApplicationModule,
    ItrApplicationFlowModule,
    ItrCategoryModule,
    GumastaApplicationModule,
    GumastaApplicationFlowModule,
    digitalSignModule,
    DigitalSignFlowModule,
    MsmeApplicationModule,
    MsmeApplicationFlowModule,
    GalleryModule,
    GalleryCategoryModule,
    BannerModule,
    PopupBannerModule,
    VideoModule,
    MenuLinksModule,
    FooterModule,
    FooterCategoryModule,
    ContactInfoModule,
    PanCategoryModule,
    PriceConfigModule,
    RetailerModule,
    LogModule,
    DistributorModule,
    GuestModule,
    PendingAppModule,
    VideoTutorialModule,
    FileUploadModule,
    RejectionListModule,
    CityCodeModule,
    FaqModule,
    StateModule,
    AccessModule,
    AllAccessFieldsModule,
    SubscriptionFlowModule,
    InitialNameModule,
    TermsAndConditionsModule,
    DashboardModule,
    BusinessEnquiryModule,
    LoanEnquiryModule,
    ContactUsEnquiryModule,
    RefundWalletModule,
    RefundWalletTransactionModule,
    RefundRequestModule,
    RewardPointModule,
    UserRewardModule,
    TransactionModule,
    VersionModule,
    RefundAndCancellationPolicyModule,
    PrivacyPolicyModule,
    BusinessOpportunityModule,
    DownloadFileModule,
    StaticPageModule,
    OtherServiceModule,
    SendEmailModule,
    PanCartModule,
    MsmeCartModule,
    GumastaCartModule,
    SubscriptionModule,
    DscCartModule,
    TransactionModule,
    CommissionModule,
    RewardModule,
    RetailerRegisterRewardModule,
    UserCommissionModule,
    CommissionUpdateHistoryModule,
    EmailTemplatesModule,
    SmsTemplateModule,
    DigitalPanModule,
    DigitalPanWalletModule,
    ZipFileModule,
    EmailLogsModule,
    monthlyExcelSheetModule,
    GumastaStateConfigModule,
    GumastaDistrictConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(checkAccessRoutes).forRoutes('*');
    consumer.apply(ErrorLoggingMiddleware).forRoutes("*");
  }
}
