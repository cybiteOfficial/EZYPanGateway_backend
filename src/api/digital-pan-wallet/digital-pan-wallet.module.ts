import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DocumentMiddleware } from '../../middleware/image.middleware';
import {
  DigitalPanWallet,
  DigitalPanWalletSchema,
} from './entities/digital-pan-wallet.entity';
import {
  DigitalPanTransactions,
  DigitalPanTransactionsSchema,
} from '../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity';
import { DigitalPanWalletController } from './digital-pan-wallet.controller';
import { DigitalPanWalletServices } from './digital-pan-wallet.service';
import { getUniqueTransactionId } from '../../helper/paymentGatewayHelper';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/entities/transaction.entity';
import { UserAuthentication } from '../../auth/auth.service';
import { AddLogFunction } from '../../helper/addLog';
import { User, UserSchema } from '../user/entities/user.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { AccessModule } from '../accessmodule/access-module.module';
import { AccessModuleSchema } from '../accessmodule/entities/access-module.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { paytmFunctions } from '../../helper/payment-gateway';
import { DigitalPanHelper } from '../digital-pan/digital-pan.helper';
import {
  DigitalPanApplication,
  DigitalPanSchema,
} from '../digital-pan/entities/digital-pan.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: DigitalPanWallet.name, schema: DigitalPanWalletSchema },
      {
        name: DigitalPanTransactions.name,
        schema: DigitalPanTransactionsSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: DigitalPanApplication.name,
        schema: DigitalPanSchema,
      },
    ]),
  ],
  controllers: [DigitalPanWalletController],
  providers: [
    DigitalPanWalletServices,
    getUniqueTransactionId,
    AddLogFunction,
    userAuthHelper,
    paytmFunctions,
    DigitalPanHelper,
  ],
})
export class DigitalPanWalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/balance/recharge-wallet',
        '/balance/get-wallet',
        '/balance/web/get-wallet-transaction',
        '/balance/list/pagination',
      );
  }
}
