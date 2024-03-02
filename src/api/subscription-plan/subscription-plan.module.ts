import {
  subscription,
  subscriptionSchema,
} from './entities/subscription-plan.entity';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserAuthentication,
  VerifyToken,
  checkAccessRoutes,
} from '../../auth/auth.service';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { SubscriptionServices } from './subscription-plan.service';
import { paytmFunctions } from '../../helper/payment-gateway';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import {
  UserFlow,
  UserFlowSchema,
} from '../user-flow/entities/user-flow.entity';
import { SubscriptionController } from './subscription-plan.controller';
import {
  SubscriptionFlow,
  SubscriptionFlowSchema,
} from '../subscription-flow/entities/subscription-flow.entity';
import { checkSubscriptionPlan } from './subscription-plan.helper';
import {
  AccessModule,
  AccessModuleSchema,
} from '../accessmodule/entities/access-module.entity';
import { getUniqueTransactionId } from '../../helper/paymentGatewayHelper';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/entities/transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: subscription.name, schema: subscriptionSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      {
        name: SubscriptionFlow.name,
        schema: SubscriptionFlowSchema,
      },
      {
        name: AccessModule.name,
        schema: AccessModuleSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionServices,
    AddLogFunction,
    checkSubscriptionPlan,
    userAuthHelper,
    getUniqueTransactionId,
    paytmFunctions,
  ],
})
export class SubscriptionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/subscription/admin/update',
        '/subscription/view/admin',
        '/subscription/change-status',
        '/subscription/admin/get-all',
        '/subscription/get-all',
        '/subscription/buy-subscription',
        '/subscription/history',
      );
  }
}
