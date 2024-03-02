import { RefundRequestService } from './refund-request.service';
import { RefundRequestController } from './refund-request.controller';
import { UserAuthentication } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefundRequest,
  RefundRequestSchema,
} from './entities/refund-request.entity';
import {
  RefundWallet,
  RefundWalletSchema,
} from '../refund-wallet/entities/refund-wallet.entity';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  RefundWalletTransactions,
  RefundWalletTransactionsSchema,
} from '../refund-wallet-transaction/entities/refund-wallet-transaction.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefundRequest.name, schema: RefundRequestSchema },
      { name: Log.name, schema: LogSchema },
      { name: RefundWallet.name, schema: RefundWalletSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      {
        name: RefundWalletTransactions.name,
        schema: RefundWalletTransactionsSchema,
      },
    ]),
  ],
  controllers: [RefundRequestController],
  providers: [RefundRequestService, AddLogFunction, userAuthHelper],
})
export class RefundRequestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/refund-request/add',
        '/refund-request/list/pagination',
        '/refund-request/admin/list/pagination',
        '/refund-request/update-status',
      );
  }
}
