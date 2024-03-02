/* eslint-disable prettier/prettier */
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { AccessModuleService } from './access-module.service';
import { AccessModuleSchema } from './entities/access-module.entity';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAuthentication } from '../../auth/auth.service';
import { AccessModuleController } from './access-module.controller';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
    ]),
  ],
  controllers: [AccessModuleController],
  providers: [AccessModuleService, AddLogFunction, userAuthHelper],
})
export class AccessModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      // '/access-modules/add',
      '/access-modules/list/pagination',
      '/access-modules/get-access-modules',
    );
  }
}
