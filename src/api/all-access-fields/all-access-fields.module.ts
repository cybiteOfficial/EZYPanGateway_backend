/* eslint-disable prettier/prettier */
import { AllAccessFieldsService } from './all-access-fields.service';
import { AllAccessFieldsController } from './all-access-fields.controller';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from './entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAuthentication } from '../../auth/auth.service';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import { AddLogFunction } from '../../helper/addLog';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [AllAccessFieldsController],
  providers: [AllAccessFieldsService, userAuthHelper, AddLogFunction],
})
export class AllAccessFieldsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/all-access-fields/add',
        '/all-access-fields/update/:id',
        '/all-access-fields/list/pagination',
      );
  }
}
