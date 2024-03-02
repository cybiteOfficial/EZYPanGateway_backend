import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { RefundAndCancellationPolicyService } from './refund-and-cancellation-policy.service';
import { RefundAndCancellationPolicyController } from './refund-and-cancellation-policy.controller';
import {
  RefundAndCancellationPolicy,
  RefundAndCancellationPolicySchema,
} from './entities/refund-and-cancellation-policy.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserAuthentication } from '../../auth/auth.service';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      {
        name: RefundAndCancellationPolicy.name,
        schema: RefundAndCancellationPolicySchema,
      },
      { name: User.name, schema: UserSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [RefundAndCancellationPolicyController],
  providers: [
    RefundAndCancellationPolicyService,
    AddLogFunction,
    userAuthHelper,
  ],
})
export class RefundAndCancellationPolicyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/refund-and-cancellation/add',
        '/refund-and-cancellation/update',
        '/refund-and-cancellation/get-all',
      );
  }
}
