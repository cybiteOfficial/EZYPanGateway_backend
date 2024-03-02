import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { NestModule, Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItrCategoryController } from './itr-category.controller';
import { ItrCategoryServices } from './itr-category.service';
import { ItrCategory, ItrCategorySchema } from './entities/itr-category.entity';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { User, UserSchema } from '../user/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
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
      { name: ItrCategory.name, schema: ItrCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [ItrCategoryController],
  providers: [ItrCategoryServices, AddLogFunction, userAuthHelper],
})
export class ItrCategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/itr-category/change-status',
        '/itr-category/add',
        '/itr-category/update',
        '/itr-category/admin/get-all',
        '/itr-category/get-all',
        '/itr-category/change-status/applicable-for-minor',
        '/itr-category/change-status/show-for-guest',
      );
  }
}
