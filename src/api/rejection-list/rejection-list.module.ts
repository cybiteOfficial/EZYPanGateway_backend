import { RejectionListController } from './rejection-list.controller';
import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  RejectionList,
  RejectionListSchema,
} from './entities/rejection-list.entity';
import { RejectionListService } from './rejection-list.service';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  UserFlow,
  UserFlowSchema,
} from '../user-flow/entities/user-flow.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RejectionList.name, schema: RejectionListSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [RejectionListController],
  providers: [RejectionListService, AddLogFunction, userAuthHelper],
})
export class RejectionListModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/rejection-list/list/pagination',
        '/rejection-list/add',
        '/rejection-list/update',
        '/rejection-list/get-all',
        '/rejection-list/delete',
        '/rejection-list/change-status',
        '/rejection-list/admin/view',
      );
  }
}
