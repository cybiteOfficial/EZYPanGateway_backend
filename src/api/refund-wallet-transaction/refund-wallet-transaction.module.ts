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
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from "./entities/refund-wallet-transaction.entity";
import { RefundWalletTransactionService } from "./refund-wallet-transaction.service";
import { RefundWalletTransactionController } from "./refund-wallet-transactionl.controller";
import { AccessModule } from "../accessmodule/access-module.module";
import { AccessModuleSchema } from "../accessmodule/entities/access-module.entity";
import {
  RefundWallet,
  RefundWalletSchema,
} from "../refund-wallet/entities/refund-wallet.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Log.name, schema: LogSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [RefundWalletTransactionController],
  providers: [RefundWalletTransactionService, AddLogFunction, userAuthHelper],
})
export class RefundWalletTransactionModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/refund-wallet-transaction/web/get-wallet-transaction",
        "/refund-wallet-transaction/list/pagination",
        "/refund-wallet-transaction/add",
        "/refund-wallet-transaction/update",
        "/refund-wallet-transaction/view",
        "/refund-wallet-transaction/delete"
      );
  }
}
