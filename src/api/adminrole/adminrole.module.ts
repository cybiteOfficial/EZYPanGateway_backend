import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { AdminRoleService } from './adminrole.service';
import { AdminRoleController } from './adminrole.controller';
import { AdminRole, AdminRoleSchema } from './entities/adminrole.entity';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAuthentication } from '../../auth/auth.service';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Otp, OtpSchema } from '../otp/entity/create-otp.entity';
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
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      {
        name: AccessModule.name,
        schema: AccessModuleSchema,
      },
    ]),
  ],
  controllers: [AdminRoleController],
  providers: [AdminRoleService, AddLogFunction, userAuthHelper],
})
export class AdminRoleModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/admin-roles/add',
        '/admin-roles/update',
        '/admin-roles/list/pagination',
        '/admin-roles/get-role-name',
        '/admin-roles/view',
      );
  }
}
