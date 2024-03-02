import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { userAuthHelper } from "../../auth/auth.helper";
import { UserAuthentication } from "../../auth/auth.service";
import { AddLogFunction } from "../../helper/addLog";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { Log, LogSchema } from "../log/entities/log.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "./entities/refund-wallet.entity";
import { RefundWalletController } from "./refund-wallet.controller";
import { RefundWalletService } from "./refund-wallet.service";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefundWallet.name, schema: RefundWalletSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: Log.name, schema: LogSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [RefundWalletController],
  providers: [RefundWalletService, AddLogFunction, userAuthHelper],
})
export class RefundWalletModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/refund-wallet/get-wallet",
        "/refund-wallet/admin/get-wallet",
        "/refund-wallet/admin/update-wallet"
      );
  }
}
